use super::*;

use std::ops::{Deref, DerefMut};

mod player_outcomes;
pub use player_outcomes::*;

mod leaderboard;
pub use leaderboard::*;

const PRIZES: [u32; 3] = [100, 50, 25];

// /// EV because of tie_breaker
// ev: Ev,

pub struct WeeklyOutcome {
    pub game_winners: Vec<GameOutcome>,
    pub odds: Odds,
    pub leaderboard: Leaderboard,
    pub player_evs: OutcomePlayerEvs,
}

pub fn get_all_possible_weekly_outcomes(week_data: WeekData) -> Vec<WeeklyOutcome> {
    let all_weekly_combos = all_combos(NUM_GAMES);
    // let outcomes =
    all_weekly_combos
        .iter()
        .map(|combo| get_outcome(&week_data, combo))
        .collect()
    // outcomes
}

fn get_outcome(week_data: &WeekData, combo: &[GameOutcome]) -> WeeklyOutcome {
    // for every player, get their score for the week, this is leaderboard
    // odds of outcome is odds of each game product

    let player_outcomes: Vec<PlayerOutcome> = week_data
        .players_picks
        .0
        .iter()
        .map(|player_picks| {
            let num_right = get_player_num_right(player_picks, combo);
            PlayerOutcome {
                player_name: player_picks.player.clone(),
                num_right,
            }
        })
        .collect();

    let odds: Odds = week_data
        .games
        .iter()
        .zip(combo)
        .map(|(game, team)| game.win_odds(team))
        .product();

    let leaderboard: Leaderboard = (&*player_outcomes).into();
    let player_evs: OutcomePlayerEvs = (&leaderboard).into();

    WeeklyOutcome {
        game_winners: combo.to_vec(),
        odds,
        leaderboard,
        player_evs,
    }
}

fn get_player_num_right(player_picks: &PlayerPicks, combo: &[GameOutcome]) -> usize {
    player_picks
        .picks
        .0
        .iter()
        .zip(combo)
        .filter(|(team, _)| team == &&GameOutcome::HomeWin)
        .count()
}

#[cfg(test)]
mod tests {
    use super::*;

    // #[test]
    // fn test_get_outcome() {
}
