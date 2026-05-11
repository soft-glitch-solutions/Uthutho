import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  Animated,
  Dimensions,
  PanResponder,
  StatusBar,
  Easing,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WifiOff, Zap, Trophy, Play, Settings, RotateCcw, Home, ChevronLeft, ChevronRight } from 'lucide-react-native';

type Props = {
  children: React.ReactNode;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Optimized for 375x667 screen
const ROAD_WIDTH = SCREEN_WIDTH * 0.92;
const ROAD_HEIGHT = SCREEN_HEIGHT * 0.52;

const PLAYER_SIZE = 56;
const OBSTACLE_SIZE = 52;

const LANES = [
  ROAD_WIDTH * 0.17,
  ROAD_WIDTH * 0.5,
  ROAD_WIDTH * 0.83,
];

const HIGHSCORE_KEY = 'uthutho_offline_highscore';

// Asset imports with fallback to emojis if images don't exist
let TAXI_SPRITE: any = null;
let BUS_SPRITE: any = null;

try {
  TAXI_SPRITE = require('../assets/game/sprites/taxi-sprite.png');
} catch (e) {
  console.log('Taxi sprite not found, using emoji fallback');
}

try {
  BUS_SPRITE = require('../assets/game/sprites/bus-sprite.png');
} catch (e) {
  console.log('Bus sprite not found, using emoji fallback');
}

export default function NetworkGate({ children }: Props) {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const sub = NetInfo.addEventListener(state => {
      const reachable = state.isInternetReachable ?? true;
      setOnline(!!state.isConnected && reachable);
    });

    NetInfo.fetch().then(state => {
      const reachable = state.isInternetReachable ?? true;
      setOnline(!!state.isConnected && reachable);
    });

    return () => sub();
  }, []);

  if (online === null) return null;

  if (!online) {
    return <OfflineMiniGame />;
  }

  return <>{children}</>;
}

function OfflineMiniGame() {
  const { colors } = useTheme();
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [lane, setLane] = useState(1);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const obstacleY = useRef(new Animated.Value(-180)).current;
  const roadOffset = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(1)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const gameOverScale = useRef(new Animated.Value(0)).current;
  const gameOverOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const playerScale = useRef(new Animated.Value(1)).current;
  const scorePulse = useRef(new Animated.Value(1)).current;
  const obstacleLane = useRef(1);
  const gameAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const currentLane = useRef(1);
  const speedRef = useRef(2400);

  // Animate menu entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(menuOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(menuScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load highscore
  useEffect(() => {
    loadHighscore();

    // Hide instructions after 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowInstructions(false));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Animate score when it increases
  useEffect(() => {
    if (score > 0) {
      Animated.sequence([
        Animated.timing(scorePulse, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scorePulse, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [score]);

  const loadHighscore = async () => {
    try {
      const saved = await AsyncStorage.getItem(HIGHSCORE_KEY);
      if (saved) {
        setBestScore(Number(saved));
      }
    } catch (e) {
      console.log('Failed to load highscore');
    }
  };

  const saveHighscore = async (value: number) => {
    try {
      await AsyncStorage.setItem(HIGHSCORE_KEY, String(value));
    } catch (e) {
      console.log('Failed to save highscore');
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 4,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -4,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const bouncePlayer = () => {
    Animated.sequence([
      Animated.timing(playerScale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playerScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Road animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(roadOffset, {
        toValue: 50,
        duration: 180,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Start game
  const startGame = () => {
    if (gameAnimation.current) {
      gameAnimation.current.stop();
    }
    obstacleY.stopAnimation();
    setScore(0);
    setLevel(1);
    setGameOver(false);
    speedRef.current = 2400;
    currentLane.current = 1;
    setLane(1);
    setScreen('game');

    setTimeout(() => {
      spawnObstacle();
    }, 200);
  };

  // Obstacle loop
  const spawnObstacle = () => {
    if (gameOver) return;

    obstacleLane.current = Math.floor(Math.random() * 3);
    obstacleY.setValue(-OBSTACLE_SIZE);

    gameAnimation.current = Animated.timing(obstacleY, {
      toValue: ROAD_HEIGHT + OBSTACLE_SIZE,
      duration: speedRef.current,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    gameAnimation.current.start(({ finished }) => {
      if (!finished || gameOver) return;

      setScore(prev => {
        const newScore = prev + 1;
        if (newScore > 0 && newScore % 5 === 0) {
          setLevel(l => l + 1);
          speedRef.current = Math.max(550, speedRef.current - 150);
        }
        return newScore;
      });

      spawnObstacle();
    });
  };

  // Collision detection
  useEffect(() => {
    const listener = obstacleY.addListener(({ value }) => {
      if (gameOver) return;

      const playerTop = ROAD_HEIGHT - 90;
      const playerBottom = playerTop + PLAYER_SIZE - 10;
      const obstacleTop = value + 10;
      const obstacleBottom = value + OBSTACLE_SIZE - 10;
      const sameLane = obstacleLane.current === currentLane.current;

      if (sameLane && obstacleBottom > playerTop && obstacleTop < playerBottom) {
        handleCrash();
      }
    });

    return () => {
      obstacleY.removeListener(listener);
    };
  }, [gameOver]);

  // Game over
  const handleCrash = async () => {
    if (gameOver) return;

    gameAnimation.current?.stop();
    setGameOver(true);
    shake();

    // Animate game over card
    Animated.parallel([
      Animated.spring(gameOverScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(gameOverOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (score > bestScore) {
      setBestScore(score);
      await saveHighscore(score);
    }
  };

  // Movement controls
  const moveLeft = () => {
    if (currentLane.current > 0 && !gameOver) {
      currentLane.current -= 1;
      setLane(currentLane.current);
      bouncePlayer();
    }
  };

  const moveRight = () => {
    if (currentLane.current < 2 && !gameOver) {
      currentLane.current += 1;
      setLane(currentLane.current);
      bouncePlayer();
    }
  };

  // Swipe controls
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 20) {
          if (gestureState.dx < 0) moveLeft();
          if (gestureState.dx > 0) moveRight();
        }
      },
    })
  ).current;

  const getLevelColor = () => {
    const colors_list = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors_list[Math.min(level - 1, colors_list.length - 1)];
  };

  // Menu screen
  if (screen === 'menu') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />

        <Animated.View
          style={[
            styles.menuCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: menuOpacity,
              transform: [{ scale: menuScale }]
            }
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
            <WifiOff size={48} color={colors.primary} />
          </View>

          <Text style={[styles.menuTitle, { color: '#FFFFFF' }]}>
            No Internet Connection
          </Text>

          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            Play the mini-game while we reconnect
          </Text>

          <View style={[styles.bestContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <View style={styles.bestHeader}>
              <Trophy size={16} color="#FBBF24" />
              <Text style={[styles.bestLabel, { color: '#FFFFFF' }]}>BEST SCORE</Text>
            </View>
            <Text style={[styles.bestValue, { color: '#FFFFFF' }]}>
              {bestScore}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={startGame}
          >
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.playButtonText}>START GAME</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => Linking.openSettings()}
          >
            <Settings size={18} color={colors.textSecondary} />
            <Text style={[styles.secondaryButtonText, { color: '#FFFFFF' }]}>
              Open Settings
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Game screen
  return (
    <View style={[styles.gameContainer, { backgroundColor: colors.background }]} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" />

      {/* Score Bar */}
      <View style={styles.topBar}>
        <Animated.View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateX: shakeAnim }] }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>SCORE</Text>
          <Animated.Text style={[styles.statValue, { color: '#FFFFFF', transform: [{ scale: scorePulse }] }]}>
            {score}
          </Animated.Text>
        </Animated.View>

        <Animated.View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderTopColor: getLevelColor(), borderTopWidth: 3 }]}>
          <Zap size={16} color={getLevelColor()} style={styles.statIcon} />
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>LEVEL</Text>
          <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{level}</Text>
        </Animated.View>

        <Animated.View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateX: shakeAnim }] }]}>
          <Trophy size={16} color="#FBBF24" style={styles.statIcon} />
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>BEST</Text>
          <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{bestScore}</Text>
        </Animated.View>
      </View>

      {/* Road */}
      <View style={[styles.road, { backgroundColor: '#1a1a2e', borderColor: colors.border }]}>
        {/* Road lines animated */}
        {[...Array(10)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.roadLine,
              {
                top: i * 70,
                transform: [{ translateY: roadOffset }],
              },
            ]}
          />
        ))}

        {/* Lane dividers */}
        <View style={[styles.laneDivider, { left: '33.33%', backgroundColor: '#2a2a3e' }]} />
        <View style={[styles.laneDivider, { left: '66.66%', backgroundColor: '#2a2a3e' }]} />

        {/* Edge lines */}
        <View style={[styles.edgeLine, { left: 0 }]} />
        <View style={[styles.edgeLine, { right: 0 }]} />

        {/* Obstacle - Taxi */}
        {!gameOver && (
          <Animated.View
            style={[
              styles.obstacle,
              {
                left: LANES[obstacleLane.current] - OBSTACLE_SIZE / 2,
                transform: [{ translateY: obstacleY }],
              },
            ]}
          >
            {TAXI_SPRITE ? (
              <Image source={TAXI_SPRITE} style={styles.obstacleImage} resizeMode="contain" />
            ) : (
              <Text style={styles.obstacleEmoji}>🚕</Text>
            )}
          </Animated.View>
        )}

        {/* Player - Bus */}
        <Animated.View
          style={[
            styles.player,
            {
              left: LANES[lane] - PLAYER_SIZE / 2,
              transform: [
                { translateX: shakeAnim },
                { scale: playerScale }
              ],
            },
          ]}
        >
          {BUS_SPRITE ? (
            <Image source={BUS_SPRITE} style={styles.playerImage} resizeMode="contain" />
          ) : (
            <Text style={styles.playerEmoji}>🚌</Text>
          )}
        </Animated.View>
      </View>

      {/* Level indicator bar */}
      <View style={styles.levelContainer}>
        <Text style={[styles.levelText, { color: '#FFFFFF' }]}>
          Speed: {Math.round((2400 - speedRef.current) / 18.5)}%
        </Text>
        <View style={[styles.levelProgressContainer, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.levelProgressBar,
              {
                width: `${Math.min(((2400 - speedRef.current) / 1850) * 100, 100)}%`,
                backgroundColor: getLevelColor(),
              },
            ]}
          />
        </View>
      </View>

      {/* Instructions overlay */}
      {showInstructions && !gameOver && (
        <Animated.View style={[styles.instructionsOverlay, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
          <Text style={styles.instructionsText}>
            ← Swipe left or right →
          </Text>
          <View style={styles.swipeArrows}>
            <ChevronLeft size={28} color="#FFFFFF" />
            <ChevronRight size={28} color="#FFFFFF" />
          </View>
        </Animated.View>
      )}

      {/* Control buttons */}
      <View style={styles.controlButtons}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.card }]}
          onPress={moveLeft}
          disabled={gameOver}
        >
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.card }]}
          onPress={moveRight}
          disabled={gameOver}
        >
          <ChevronRight size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Game over modal with improved animation */}
      {gameOver && (
        <Animated.View
          style={[
            styles.gameOverCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: gameOverOpacity,
              transform: [{ scale: gameOverScale }]
            }
          ]}
        >
          <View style={[styles.gameOverIcon, { backgroundColor: `${colors.error}15` }]}>
            <Text style={styles.gameOverEmoji}>💥</Text>
          </View>

          <Text style={[styles.gameOverTitle, { color: '#FFFFFF' }]}>
            Game Over!
          </Text>

          <Text style={[styles.gameOverText, { color: colors.textSecondary }]}>
            You dodged <Text style={[styles.highlightText, { color: colors.primary, fontSize: 26 }]}>{score}</Text> taxis
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>Highest Score</Text>
              <Text style={[styles.statRowValue, { color: '#FFFFFF' }]}>{bestScore}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>Level Reached</Text>
              <Text style={[styles.statRowValue, { color: '#FFFFFF' }]}>{level}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.playAgainButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={startGame}
          >
            <RotateCcw size={20} color="#FFFFFF" />
            <Text style={styles.playAgainButtonText}>PLAY AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => {
              Animated.parallel([
                Animated.timing(gameOverOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(gameOverScale, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start(() => setScreen('menu'));
            }}
          >
            <Home size={18} color="#FFFFFF" />
            <Text style={[styles.menuButtonText, { color: '#FFFFFF' }]}>
              Main Menu
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gameContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },

  menuCard: {
    width: SCREEN_WIDTH * 0.88,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },

  menuSubtitle: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 18,
  },

  bestContainer: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    width: '100%',
  },

  bestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  bestLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  bestValue: {
    fontSize: 40,
    fontWeight: 'bold',
  },

  playButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  playButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  secondaryButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },

  topBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },

  statCard: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 85,
    borderWidth: 1,
    position: 'relative',
  },

  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },

  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 3,
  },

  statIcon: {
    position: 'absolute',
    top: 6,
    right: 8,
  },

  road: {
    width: ROAD_WIDTH,
    height: ROAD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  roadLine: {
    position: 'absolute',
    width: 5,
    height: 35,
    backgroundColor: '#4a4a6e',
    borderRadius: 3,
  },

  laneDivider: {
    position: 'absolute',
    width: 2,
    height: '100%',
  },

  edgeLine: {
    position: 'absolute',
    width: 3,
    height: '100%',
    backgroundColor: '#FBBF24',
    opacity: 0.5,
  },

  player: {
    position: 'absolute',
    bottom: 15,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  playerImage: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  },

  playerEmoji: {
    fontSize: 48,
  },

  obstacle: {
    position: 'absolute',
    width: OBSTACLE_SIZE,
    height: OBSTACLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  obstacleImage: {
    width: OBSTACLE_SIZE,
    height: OBSTACLE_SIZE,
  },

  obstacleEmoji: {
    fontSize: 44,
  },

  levelContainer: {
    width: ROAD_WIDTH,
    marginTop: 16,
    alignItems: 'center',
    gap: 6,
  },

  levelText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  levelProgressContainer: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },

  levelProgressBar: {
    height: '100%',
    borderRadius: 3,
  },

  instructionsOverlay: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  instructionsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },

  swipeArrows: {
    flexDirection: 'row',
    gap: 20,
  },

  controlButtons: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    marginBottom: 12,
  },

  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  gameOverCard: {
    position: 'absolute',
    bottom: 40,
    width: SCREEN_WIDTH * 0.84,
    padding: 22,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 15,
  },

  gameOverIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  gameOverEmoji: {
    fontSize: 40,
  },

  gameOverTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  gameOverText: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },

  highlightText: {
    fontWeight: 'bold',
  },

  statsContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },

  statRowLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  statRowValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  playAgainButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  playAgainButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },

  menuButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },

  menuButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
});