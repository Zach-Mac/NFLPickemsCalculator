use server::*;

mod teams;

fn main() {
    // let week_data = WeekData {
    //     players_picks: AllPicks(vec![
    //         PlayerPicks {
    //             player: "Zach".to_string(),
    //             picks: Picks([GameOutcome::HomeWin, GameOutcome::AwayWin]),
    //             tie_breaker: 0,
    //         },
    //         PlayerPicks {
    //             player: "Chris".to_string(),
    //             picks: Picks([GameOutcome::HomeWin, GameOutcome::AwayWin]),
    //             tie_breaker: 0,
    //         },
    //     ]),
    //     games: [
    //         Game {
    //             home_team: "New England Patriots".to_string(),
    //             away_team: "New York Giants".to_string(),
    //             home_score: 10,
    //             away_score: 7,
    //             winner: 0,
    //             state: GameState::NotStarted,
    //             odds: GameOdds {
    //                 home_win: Odds {
    //                     nfelo: 0.5,
    //                     espn: 0.5,
    //                 },
    //                 away_win: Odds {
    //                     nfelo: 0.5,
    //                     espn: 0.5,
    //                 },
    //                 tie: Odds {
    //                     nfelo: 0.5,
    //                     espn: 0.5,
    //                 },
    //             },
    //         },
    //         Game {
    //             home_team: "New England Patriots".to_string(),
    //             away_team: "New York Giants".to_string(),
    //             home_score: 10,
    //             away_score: 7,
    //             winner: 0,
    //             state: GameState::NotStarted,
    //             odds: GameOdds {
    //                 home_win: Odds {
    //                     nfelo: 0.5,
    //                     espn: 0.5,
    //                 },
    //                 away_win: Odds {
    //                     nfelo: 0.5,
    //                     espn: 0.5,
    //                 },
    //                 tie: Odds {
    //                     nfelo: 0.5,
    //                     espn: 0.5,
    //                 },
    //             },
    //         },
    //     ]
    //     .into(),
    // };

    // let all_outcomes = get_all_possible_weekly_outcomes(week_data);

    // let weekly_evs = get_weekly_evs(all_outcomes);
    // println!("{:?}", weekly_evs);

    // let weekly_game_evs = get_weekly_game_evs(weekly_evs);
    // println!("{:?}", weekly_game_evs);

    // {game: {player: ev for player for game}}
}
