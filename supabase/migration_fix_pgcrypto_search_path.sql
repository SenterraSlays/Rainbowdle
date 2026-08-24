-- Fix "function gen_salt(unknown) does not exist" when creating a
-- password-protected room.
--
-- Cause: Supabase installs the pgcrypto extension into the `extensions`
-- schema by default, but create_room/join_room only had
-- `search_path = public`, so gen_salt()/crypt() weren't visible.
--
-- Run this once in the Supabase SQL editor against your existing project.

create or replace function create_room(p_max_players int default 6, p_visibility text default 'public', p_password text default null)
returns rooms
language plpgsql
security definer
set search_path = public, extensions
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

create or replace function join_room(p_code text, p_password text default null)
returns rooms
language plpgsql
security definer
set search_path = public, extensions
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
