use std::collections::HashMap;

mod outcomes;
pub use outcomes::*;

mod ev;
pub use ev::*;

const NUM_GAMES: usize = 16;

pub fn get_weekly_evs(outcomes: Vec<WeeklyOutcome>) -> WeeklyEvs {
    // let all_players = week_data.player_picks.get_all_players();
    // let mut evs = WeeklyEvs::new(all_players);
    let mut evs = WeeklyEvs::default();

    for outcome in outcomes {
        for (player_name, ev) in &*outcome.player_evs {
            let curr_ev = evs.get_mut(player_name).unwrap();
            *curr_ev += outcome.odds * *ev;
        }
    }

    evs
}

type Player = String;

struct AllPicks(Vec<PlayerPicks>);
impl AllPicks {
    fn get_all_players(&self) -> Vec<Player> {
        self.0.iter().map(|p| p.player.clone()).collect()
    }
}

pub struct WeekData {
    players_picks: AllPicks,
    games: [Game; NUM_GAMES],
}

struct PlayerPicks {
    player: Player,
    picks: Picks,
    tie_breaker: u32,
}

#[derive(Debug, Clone, PartialEq)]
enum GameOutcome {
    HomeWin,
    AwayWin,
    Tie,
}

/// Games are sorted by schedued start time, then by home team.
struct Picks([GameOutcome; NUM_GAMES]);

/// Games are sorted by schedued start time, then by home team.
struct GameWinners([GameOutcome; NUM_GAMES]);

struct Game {
    home_team: String,
    away_team: String,
    home_score: u32,
    away_score: u32,
    outcome: Option<GameOutcome>,
    state: GameState,
    odds: GameOdds,
}

impl Game {
    fn win_odds(&self, team: &GameOutcome) -> Odds {
        match team {
            GameOutcome::HomeWin => self.odds.home_win,
            GameOutcome::AwayWin => self.odds.away_win,
            GameOutcome::Tie => self.odds.tie,
        }
    }
}

enum GameState {
    NotStarted,
    InProgress,
    Finished,
}

type WeeklyEvs = HashMap<Player, Ev>;

struct GameOdds {
    home_win: Odds,
    away_win: Odds,
    tie: Odds,
}

fn all_combos(n: usize) -> Vec<Vec<GameOutcome>> {
    let tot = 2usize.pow(n as u32); // 3^n combos (note: pow expects u32)
    dbg!(tot);
    let mut out = Vec::with_capacity(tot);

    for i in 0..tot {
        let mut x = i;
        let mut combo = Vec::with_capacity(n as usize);
        for _ in 0..n {
            combo.push(match x % 2 {
                0 => GameOutcome::HomeWin,
                1 => GameOutcome::AwayWin,
                _ => unreachable!(),
            });
            x /= 3;
        }
        combo.reverse(); // digits were pushed least-significant first
        out.push(combo);
    }

    out
}
