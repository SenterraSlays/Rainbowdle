-- Run this once in your Supabase project's SQL editor (Supabase Dashboard
-- > SQL Editor) to bring an already-deployed database up to date with the
-- new multiplayer sidebar feature. It's safe to run even if some of these
-- objects already match -- `create or replace` and `if not exists` make it
-- idempotent.

alter table room_guesses
    add column if not exists field_states jsonb not null default '[]'::jsonb;

-- room_guesses was never included in the realtime publication, so guess
-- rows never pushed updates to other clients (or to your own sidebar).
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'room_guesses'
    ) then
        alter publication supabase_realtime add table room_guesses;
    end if;
end $$;

-- --------------------------------------------------------------------
-- Public/private/hidden lobbies, room passwords, and a lowered 6-player
-- cap. Existing rooms default to visibility = 'public' with no password,
-- which preserves today's join-by-code behavior for anything already
-- in flight.
-- --------------------------------------------------------------------

alter table rooms
    add column if not exists visibility text not null default 'public';

alter table rooms
    add column if not exists password_hash text;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'rooms_visibility_check'
    ) then
        alter table rooms add constraint rooms_visibility_check
            check (visibility in ('public', 'private', 'hidden'));
    end if;
end $$;

-- Existing rooms may have max_players up to 8 from before the cap was
-- lowered to 6; clamp them down so the new check constraint can apply.
update rooms set max_players = 6 where max_players > 6;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'rooms_max_players_check'
    ) then
        alter table rooms add constraint rooms_max_players_check
            check (max_players between 2 and 6);
    end if;
end $$;

alter table rooms alter column max_players set default 6;

drop policy if exists "rooms are readable by anyone signed in" on rooms;

create policy "rooms are readable when public, joined, or hosted"
    on rooms for select
    using (
        (visibility = 'public' and status = 'lobby')
        or host_id = auth.uid()
        or exists (
            select 1 from room_players rp
            where rp.room_id = rooms.id and rp.profile_id = auth.uid() and rp.left_at is null
        )
    );

drop function if exists create_room(int);

create or replace function create_room(p_max_players int default 6, p_visibility text default 'public', p_password text default null)
returns rooms
language plpgsql
security definer
set search_path = public
as $$
declare
    result rooms;
    new_code text;
    tries int := 0;
    picked_operator text;
    stored_hash text;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    if p_max_players < 2 or p_max_players > 6 then
        raise exception 'invalid player limit';
    end if;

    if p_visibility not in ('public', 'private', 'hidden') then
        raise exception 'invalid visibility';
    end if;

    if p_visibility = 'private' then
        if p_password is null or length(trim(p_password)) < 1 then
            raise exception 'private rooms require a password';
        end if;
        stored_hash := crypt(p_password, gen_salt('bf'));
    else
        stored_hash := null;
    end if;

    loop
        new_code := generate_room_code();
        tries := tries + 1;
        exit when not exists (select 1 from rooms where code = new_code and status <> 'closed');
        if tries > 20 then
            raise exception 'could not allocate room code';
        end if;
    end loop;

    select name into picked_operator from operators order by random() limit 1;

    insert into rooms (code, host_id, max_players, visibility, password_hash)
    values (new_code, auth.uid(), p_max_players, p_visibility, stored_hash)
    returning * into result;

    insert into room_secrets (room_id, mystery_operator_name)
    values (result.id, picked_operator);

    insert into room_players (room_id, profile_id, username)
    select result.id, auth.uid(), username from profiles where id = auth.uid();

    return result;
end;
$$;

grant execute on function create_room(int, text, text) to authenticated;

create or replace function list_open_rooms()
returns table (
    id uuid,
    code text,
    visibility text,
    max_players int,
    player_count bigint,
    host_username text
)
language sql
security definer
set search_path = public
as $$
    select r.id, r.code, r.visibility, r.max_players,
           (select count(*) from room_players rp where rp.room_id = r.id and rp.left_at is null) as player_count,
           p.username as host_username
    from rooms r
    join profiles p on p.id = r.host_id
    where r.status = 'lobby' and r.visibility in ('public', 'private')
    order by r.created_at desc
    limit 50;
$$;

grant execute on function list_open_rooms() to authenticated;

drop function if exists join_room(text);

create or replace function join_room(p_code text, p_password text default null)
returns rooms
language plpgsql
security definer
set search_path = public
as $$
declare
    target rooms;
    player_count int;
    my_username text;
    already_member boolean;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    select * into target from rooms where code = upper(p_code) and status in ('lobby', 'playing');
    if target.id is null then
        raise exception 'room not found';
    end if;

    select exists(
        select 1 from room_players
        where room_id = target.id and profile_id = auth.uid() and left_at is null
    ) into already_member;

    if not already_member then
        if target.visibility = 'private' then
            if p_password is null or target.password_hash is null
                or crypt(p_password, target.password_hash) <> target.password_hash then
                raise exception 'incorrect password';
            end if;
        end if;

        select count(*) into player_count from room_players where room_id = target.id and left_at is null;
        if player_count >= target.max_players then
            raise exception 'room full';
        end if;
        if target.status <> 'lobby' then
            raise exception 'room already started';
        end if;
    end if;

    select username into my_username from profiles where id = auth.uid();

    insert into room_players (room_id, profile_id, username)
    values (target.id, auth.uid(), my_username)
    on conflict (room_id, profile_id) do update set left_at = null, username = excluded.username;

    update rooms set last_activity_at = now() where id = target.id;

    return target;
end;
$$;

grant execute on function join_room(text, text) to authenticated;

create or replace function mp_submit_guess(p_room_id uuid, p_operator_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    room rooms;
    player room_players;
    mystery operators;
    guess operators;
    result jsonb;
    fields jsonb := '[]'::jsonb;
    is_correct boolean;
    next_guess_number int;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    select * into room from rooms where id = p_room_id and status = 'playing';
    if room.id is null then
        raise exception 'room not in progress';
    end if;

    select * into player from room_players
    where room_id = p_room_id and profile_id = auth.uid() and left_at is null;
    if player.room_id is null then
        raise exception 'not in this room';
    end if;

    if player.finished then
        raise exception 'already finished';
    end if;

    if player.guesses_count >= 10 then
        raise exception 'no guesses remaining';
    end if;

    select * into guess from operators where name = p_operator_name;
    if guess.name is null then
        raise exception 'unknown operator';
    end if;

    select o.* into mystery
    from room_secrets rs
    join operators o on o.name = rs.mystery_operator_name
    where rs.room_id = p_room_id;

    is_correct := guess.name = mystery.name;
    next_guess_number := player.guesses_count + 1;

    fields := fields || jsonb_build_object('key', 'gender', 'state', case when guess.gender = mystery.gender then 'match' else 'mismatch' end, 'guessValue', guess.gender);
    fields := fields || jsonb_build_object('key', 'role', 'state', case when guess.role = mystery.role then 'match' else 'mismatch' end, 'guessValue', guess.role);
    fields := fields || jsonb_build_object('key', 'side', 'state', case when guess.side = mystery.side then 'match' else 'mismatch' end, 'guessValue', guess.side);
    fields := fields || jsonb_build_object('key', 'speed', 'state', case when guess.speed = mystery.speed then 'match' when mystery.speed > guess.speed then 'higher' else 'lower' end, 'guessValue', guess.speed);
    fields := fields || jsonb_build_object('key', 'armor', 'state', case when guess.armor = mystery.armor then 'match' when mystery.armor > guess.armor then 'higher' else 'lower' end, 'guessValue', guess.armor);
    fields := fields || jsonb_build_object('key', 'releaseYear', 'state', case when guess.release_year = mystery.release_year then 'match' when mystery.release_year > guess.release_year then 'higher' else 'lower' end, 'guessValue', guess.release_year);

    insert into room_guesses (room_id, profile_id, guess_operator_name, is_correct, guess_number, field_states)
    values (p_room_id, auth.uid(), guess.name, is_correct, next_guess_number, fields);

    update room_players
    set guesses_count = next_guess_number,
        solved = is_correct,
        solved_at = case when is_correct then now() else solved_at end,
        finished = is_correct or next_guess_number >= 10
    where room_id = p_room_id and profile_id = auth.uid();

    update rooms set last_activity_at = now() where id = p_room_id;

    result := jsonb_build_object(
        'isCorrect', is_correct,
        'guessNumber', next_guess_number,
        'fields', fields,
        'operatorName', guess.name,
        'mysteryOperatorName', case when is_correct or next_guess_number >= 10 then mystery.name else null end,
        'hints', jsonb_build_object(
            'secondaryGadgets', case when next_guess_number >= 4 then to_jsonb(mystery.secondary_gadgets) else null end,
            'secondaryWeapons', case when next_guess_number >= 6 then to_jsonb(mystery.secondary_weapons) else null end,
            'primaryWeapons', case when next_guess_number >= 8 then to_jsonb(mystery.primary_weapons) else null end
        )
    );

    return result;
end;
$$;

grant execute on function mp_submit_guess(uuid, text) to authenticated;