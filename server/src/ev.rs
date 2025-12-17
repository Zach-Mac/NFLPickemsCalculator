use std::ops::AddAssign;
use std::{iter::Product, ops::Mul};

pub type GameEv = f64;

/// INVARIANT: odds are between 0 and 1
#[derive(Debug, Clone, Copy)]
pub struct Odds {
    nfelo: f64,
    espn: f64,
}
impl Product for Odds {
    fn product<I: Iterator<Item = Self>>(iter: I) -> Self {
        let mut odds = Odds {
            nfelo: 1.0,
            espn: 1.0,
        };
        for o in iter {
            odds.nfelo *= o.nfelo;
            odds.espn *= o.espn;
        }
        odds
    }
}
impl Mul<GameEv> for Odds {
    type Output = Ev;
    fn mul(self, rhs: GameEv) -> Self::Output {
        Ev {
            nfelo: self.nfelo * rhs,
            espn: self.espn * rhs,
        }
    }
}

#[derive(Debug, Default, Clone, Copy)]
pub struct Ev {
    pub nfelo: f64,
    pub espn: f64,
}
impl AddAssign for Ev {
    fn add_assign(&mut self, other: Ev) {
        self.nfelo += other.nfelo;
        self.espn += other.espn;
    }
}
