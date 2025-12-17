use super::*;

pub struct OutcomePlayerEvs(HashMap<Player, GameEv>);
impl Deref for OutcomePlayerEvs {
    type Target = HashMap<Player, GameEv>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
impl DerefMut for OutcomePlayerEvs {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}
impl From<&Leaderboard> for OutcomePlayerEvs {
    fn from(leaderboard: &Leaderboard) -> Self {
        // let mut outcome_player_evs = OutcomePlayerEvs(HashMap::new());
        //
        // let limit = 100000;
        // let mut i = 0;
        //
        // let mut prize_iter = PRIZES.into_iter();
        //
        // while let Some(mut cur_prize) = prize_iter.next() {
        //     i += 1;
        //     if i > limit {
        //         break;
        //     }
        //
        //     for (rank, players) in leaderboard.iter().enumerate() {
        //         while let Some(next_player) = players.iter().next() {
        //             if let Some(prize) = prize_iter.next() {
        //                 cur_prize += prize;
        //             }
        //         }
        //     }
        // }
        //
        // outcome_player_evs

        let mut outcome_player_evs = OutcomePlayerEvs(HashMap::new());
        for player in leaderboard.iter().flatten() {
            outcome_player_evs.insert(player.player_name.clone(), GameEv::default());
        }

        let limit = 100000;
        let mut i = 0;

        let mut prize_index = 0;
        while prize_index < PRIZES.len() {
            i += 1;
            if i > limit {
                break;
            }

            for (rank, players_in_rank) in leaderboard.iter().enumerate() {
                if players_in_rank.is_empty() {
                    continue;
                }

                let mut cur_prize = 0;

                for _ in 0..players_in_rank.len() {
                    if prize_index >= PRIZES.len() {
                        break;
                    }

                    cur_prize += PRIZES[prize_index];
                    prize_index += 1;
                }

                let prize_per_player = (cur_prize as f64) / (players_in_rank.len() as f64);
                dbg!(prize_per_player);

                for player in players_in_rank {
                    *outcome_player_evs.get_mut(&player.player_name).unwrap() += prize_per_player;
                }
            }
        }

        outcome_player_evs
    }
}

/// INVARIANT: index is players rank on leaderboard
#[derive(Debug)]
pub struct Leaderboard(Vec<Vec<PlayerOutcome>>);
impl Deref for Leaderboard {
    type Target = Vec<Vec<PlayerOutcome>>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
impl From<&[PlayerOutcome]> for Leaderboard {
    fn from(player_outcomes: &[PlayerOutcome]) -> Leaderboard {
        // sort by num_right
        // then group into ranks (ties)

        // let mut leaderboard: Vec<Vec<PlayerOutcome>> = vec![vec![]; player_outcomes.len()];
        let mut leaderboard = vec![];
        for player_outcome in player_outcomes.to_vec().into_iter() {
            let outcome = player_outcome;
            leaderboard.push(vec![outcome]);
        }
        leaderboard.sort_by_key(|players| players.iter().map(|p| p.num_right).sum::<usize>());
        leaderboard.reverse();
        dbg!(&leaderboard);

        Leaderboard(leaderboard)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_leaderboard() {
        let player_outcomes = vec![
            PlayerOutcome {
                player_name: "Zach".to_string(),
                num_right: 2,
            },
            PlayerOutcome {
                player_name: "Chris".to_string(),
                num_right: 1,
            },
        ];
        let leaderboard = Leaderboard::from(player_outcomes.as_slice());
        assert_eq!(leaderboard.len(), 2);
        assert_eq!(leaderboard[0].len(), 1);
        assert_eq!(leaderboard[1].len(), 1);
    }

    mod test_leaderboard_to_outcome_player_evs {
        use super::*;

        fn player_outcome(player_name: &str, num_right: usize) -> PlayerOutcome {
            PlayerOutcome {
                player_name: player_name.to_string(),
                num_right,
            }
        }
        fn make_rank(names: &[&str], num_right: usize) -> Vec<PlayerOutcome> {
            names
                .iter()
                .map(|name| player_outcome(name, num_right))
                .collect()
        }
        fn blank_rank() -> Vec<PlayerOutcome> {
            vec![]
        }

        #[test]
        fn test_simple() {
            let leaderboard = Leaderboard(vec![
                make_rank(&["Zach"], 9),
                make_rank(&["Liam"], 8),
                make_rank(&["John"], 7),
                make_rank(&["Jim"], 6),
                make_rank(&["Josh"], 6),
            ]);
            let outcome_player_evs = OutcomePlayerEvs::from(&leaderboard);

            assert_eq!(outcome_player_evs.len(), 5);
            assert_eq!(outcome_player_evs["Zach"], 100.0);
            assert_eq!(outcome_player_evs["Liam"], 50.0);
            assert_eq!(outcome_player_evs["John"], 25.0);
            assert_eq!(outcome_player_evs["Jim"], 0.0);
            assert_eq!(outcome_player_evs["Josh"], 0.0);
        }

        #[test]
        fn test_simple_tie() {
            let leaderboard = Leaderboard(vec![
                make_rank(&["Zach", "Liam"], 9),
                blank_rank(),
                make_rank(&["John"], 7),
                make_rank(&["Jim"], 6),
                make_rank(&["Josh"], 6),
            ]);
            let outcome_player_evs = OutcomePlayerEvs::from(&leaderboard);

            assert_eq!(outcome_player_evs.len(), 5);
            assert_eq!(outcome_player_evs["Zach"], 75.0);
            assert_eq!(outcome_player_evs["Liam"], 75.0);
            assert_eq!(outcome_player_evs["John"], 25.0);
            assert_eq!(outcome_player_evs["Jim"], 0.0);
            assert_eq!(outcome_player_evs["Josh"], 0.0);
        }

        #[test]
        fn test_two_ties() {
            let leaderboard = Leaderboard(vec![
                make_rank(&["Zach", "Liam"], 9),
                blank_rank(),
                make_rank(&["John", "Jim"], 7),
                blank_rank(),
                make_rank(&["Josh"], 6),
            ]);
            let outcome_player_evs = OutcomePlayerEvs::from(&leaderboard);

            assert_eq!(outcome_player_evs.len(), 5);
            assert_eq!(outcome_player_evs["Zach"], 75.0);
            assert_eq!(outcome_player_evs["Liam"], 75.0);
            assert_eq!(outcome_player_evs["John"], 12.5);
            assert_eq!(outcome_player_evs["Jim"], 12.5);
            assert_eq!(outcome_player_evs["Josh"], 0.0);
        }

        #[test]
        fn test_triple_first() {
            let leaderboard = Leaderboard(vec![
                make_rank(&["Zach", "Liam", "John"], 9),
                blank_rank(),
                blank_rank(),
                make_rank(&["Jim"], 6),
                make_rank(&["Josh"], 6),
            ]);
            let outcome_player_evs = OutcomePlayerEvs::from(&leaderboard);

            assert_eq!(outcome_player_evs.len(), 5);
            assert_eq!(outcome_player_evs["Zach"], 175.0 / 3.0);
            assert_eq!(outcome_player_evs["Liam"], 175.0 / 3.0);
            assert_eq!(outcome_player_evs["John"], 175.0 / 3.0);
            assert_eq!(outcome_player_evs["Jim"], 0.0);
            assert_eq!(outcome_player_evs["Josh"], 0.0);
        }
    }
}
