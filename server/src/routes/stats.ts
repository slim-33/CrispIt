import { Router, Request, Response } from 'express';
import User from '../models/User';
import Scan from '../models/Scan';

const router = Router();

const ALL_BADGES = [
  { id: 'first_scan', name: 'First Scan', description: 'Scan your first item', icon: 'camera', threshold: (u: any) => u.total_scans >= 1 },
  { id: 'streak_3', name: '3-Day Streak', description: 'Scan 3 days in a row', icon: 'fire', threshold: (u: any) => u.best_streak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', description: 'Scan 7 days in a row', icon: 'trophy', threshold: (u: any) => u.best_streak >= 7 },
  { id: 'carbon_saver', name: 'Carbon Saver', description: 'Save 5kg of CO2', icon: 'leaf', threshold: (u: any) => u.total_carbon_saved >= 5 },
  { id: 'scanner_pro', name: 'Scanner Pro', description: 'Scan 50 items', icon: 'star', threshold: (u: any) => u.total_scans >= 50 },
  { id: 'eco_warrior', name: 'Eco Warrior', description: 'Reach 80+ sustainability score', icon: 'globe', threshold: (u: any) => u.sustainability_score >= 80 },
];

// GET /api/stats — get user statistics
router.get('/', async (_req: Request, res: Response) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.json({
        total_scans: 0,
        total_carbon_saved: 0,
        current_streak: 0,
        best_streak: 0,
        sustainability_score: 50,
        badges: ALL_BADGES.map(b => ({ ...b, earned: false, threshold: undefined })),
        weekly_carbon: [],
      });
    }

    // Calculate badges
    const badges = ALL_BADGES.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      earned: b.threshold(user),
      earned_date: b.threshold(user) ? user.created_at.toISOString() : undefined,
    }));

    // Get weekly carbon data from scans
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentScans = await Scan.find({ created_at: { $gte: weekAgo } }).sort({ created_at: 1 });

    const weeklyCarbon = recentScans.reduce((acc: any[], scan) => {
      const date = scan.created_at.toISOString().split('T')[0];
      const existing = acc.find(d => d.date === date);
      const co2 = scan.carbon_footprint?.co2e_per_kg || 0;
      if (existing) {
        existing.co2e += co2;
      } else {
        acc.push({ date, co2e: co2 });
      }
      return acc;
    }, []);

    res.json({
      total_scans: user.total_scans,
      total_carbon_saved: +user.total_carbon_saved.toFixed(2),
      current_streak: user.current_streak,
      best_streak: user.best_streak,
      sustainability_score: user.sustainability_score,
      badges,
      weekly_carbon: weeklyCarbon,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({
      total_scans: 0,
      total_carbon_saved: 0,
      current_streak: 0,
      best_streak: 0,
      sustainability_score: 50,
      badges: [],
      weekly_carbon: [],
    });
  }
});

export default router;
