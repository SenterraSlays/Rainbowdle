-- Fix: other players in a multiplayer room always show "No guesses yet…"
-- in the sidebar, even after they've guessed.
--
-- Cause: room_guesses had `select` restricted to `auth.uid() = profile_id`,
-- so the client-side subscription (js/multiplayer.js _refreshGuesses) could
-- only ever see your own guesses, not your roommates'. field_states was
-- always intended to be shared within a room (see schema.sql's column
-- comment) -- the policy just never allowed it.
--
-- Run this once in the Supabase SQL editor against your existing project.

drop policy if exists "a player can read only their own room guesses" on room_guesses;

create policy "room members can read guesses in their room"
    on room_guesses for select
    using (
        exists (
            select 1 from room_players rp
            where rp.room_id = room_guesses.room_id
              and rp.profile_id = auth.uid()
              and rp.left_at is null
        )
    );
