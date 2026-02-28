import { statsStore } from '../store/StatsStore';
import { taskStore, Task } from '../store/TaskStore';

// Helper to get combined active + archived tasks synchronously 
const getAllTasks = (): Task[] => {
    const { tasks, archivedTasks } = taskStore.getState();
    return [...tasks, ...archivedTasks];
};

export const analyticsCalcs = {
    getTodayMinutes: (): number => {
        const { stats } = statsStore.getState();
        if (!stats.dailyHistory) return 0;
        const today = new Date().toLocaleDateString('en-CA');
        return stats.dailyHistory[today] || 0;
    },

    getFlowScore: (): number => {
        const { stats } = statsStore.getState();
        const focus = stats.sessionCounts?.focus || 0;
        const abandoned = stats.abandonedSessions || 0;
        const total = focus + abandoned;
        
        if (total === 0) return 0;
        return Math.round((focus / total) * 100);
    },

    getGoldenHour: (): { time: string } | null => {
        const { stats } = statsStore.getState();
        if (!stats.hourlyActivity || stats.hourlyActivity.every(h => h === 0)) return null;
        const maxVal = Math.max(...stats.hourlyActivity);
        const hour = stats.hourlyActivity.indexOf(maxVal);
        return { time: `${hour}:00 - ${(hour + 1) % 24}:00` };
    },

    getDailyAverage: (): number => {
        const { stats } = statsStore.getState();
        if (!stats.installDate) return 0;
        const start = new Date(stats.installDate).getTime();
        const now = new Date().getTime();
        const diffTime = Math.abs(now - start);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); 
        return Math.round(stats.minutes / diffDays);
    },

    getEstimationAccuracy: (): { val: number, text: string, color: string } => {
        const allTasks = getAllTasks();
        const completedWithEstimates = allTasks.filter(t => t.completed);
        
        if (completedWithEstimates.length === 0) return { val: 100, text: "No data", color: "#a4b0be" };
        
        let totalEst = 0, totalAct = 0;
        completedWithEstimates.forEach(t => { 
            totalEst += (t.estimatedPomos || 1); 
            totalAct += (t.completedPomos || 0); 
        });
        
        if (totalAct === 0 && totalEst > 0) return { val: 0, text: "Needs focus", color: "#ff6b6b" };
        
        const ratio = (totalAct / totalEst); 
        const percentage = Math.round(ratio * 100);
        
        if (percentage > 120) return { val: percentage, text: `Underestimating (${percentage}%)`, color: "#ff6b6b" };
        if (percentage < 80) return { val: percentage, text: `Overestimating (${percentage}%)`, color: "#54a0ff" };
        return { val: percentage, text: "Spot on!", color: "#78b159" };
    },

    getPriorityFocus: (): number => {
        const { stats } = statsStore.getState();
        const dist = stats.priorityDist || { 4: 0, 3: 0, 2: 0, 1: 0 };
        const highPrioTime = (dist[4] || 0) + (dist[3] || 0);
        const totalTime = Object.values(dist).reduce((acc: number, curr: number) => acc + curr, 0);

        if (totalTime === 0) return 0;
        return Math.round((highPrioTime / totalTime) * 100);
    },

    getProcrastinationIndex: (): string => {
        const allTasks = getAllTasks();
        const completedTasks = allTasks.filter(t => t.completed && t.createdAt && t.dueDate); // assuming createdAt exists
        if (completedTasks.length === 0) return "0h";
        
        let totalDiff = 0;
        let count = 0;

        completedTasks.forEach(t => { 
            if(!t.dueDate || !t.archivedAt) return; // archivedAt acts as completion time locally
            const parts = t.dueDate.split('-');
            const dueEnd = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]), 23, 59, 59, 999).getTime();
            
            if (t.archivedAt > dueEnd) {
                totalDiff += (t.archivedAt - dueEnd);
                count++;
            }
        });
        
        if (count === 0) return "0h";

        const avgMs = totalDiff / count;
        const avgMinutes = Math.round(avgMs / (1000 * 60));
        
        if (avgMinutes < 60) return `${avgMinutes}m`;
        
        const avgHours = Math.round(avgMinutes / 60);
        if (avgHours > 24) return `${Math.round(avgHours/24)} days`;
        return `${avgHours} hours`;
    },

    getCategoryChampion: (): string => {
        const allTasks = getAllTasks();
        const cats: Record<string, { total: number, completed: number }> = {};
        allTasks.forEach(t => {
            if (!cats[t.category]) cats[t.category] = { total: 0, completed: 0 };
            cats[t.category].total++;
            if (t.completed) cats[t.category].completed++;
        });
        
        let champ = "None";
        let maxCount = -1;
        
        Object.entries(cats).forEach(([name, data]) => {
            if (data.total < 1) return;
            if (data.completed > maxCount) { 
                maxCount = data.completed; 
                champ = name; 
            }
        });
        return champ;
    },

    getFlowDepth: (): string => {
        const { stats } = statsStore.getState();
        const totalSessions = stats.sessionCounts?.focus || 1;
        return ((stats.totalPauses || 0) / totalSessions).toFixed(1);
    },

    getAbandonmentRate: (): number => {
        const { stats } = statsStore.getState();
        const focus = stats.sessionCounts?.focus || 0;
        const abandoned = stats.abandonedSessions || 0;
        const total = focus + abandoned;
        
        if (total === 0) return 0;
        return Math.round((abandoned / total) * 100);
    },

    getWeekSplit: (): { wd: number, we: number } => {
        const { stats } = statsStore.getState();
        let wd = 0, we = 0;
        Object.entries(stats.dailyHistory || {}).forEach(([date, mins]) => {
            const d = new Date(date).getDay();
            if (d === 0 || d === 6) we += Number(mins);
            else wd += Number(mins);
        });
        const total = wd + we;
        if (total === 0) return { wd: 0, we: 0 };
        return { wd: Math.round((wd/total)*100), we: Math.round((we/total)*100) };
    },

    getNightOwlScore: (): number => {
        const { stats } = statsStore.getState();
        if (!stats.hourlyActivity) return 0;
        const lateHours = stats.hourlyActivity[22] + stats.hourlyActivity[23] + stats.hourlyActivity[0] + stats.hourlyActivity[1];
        const total = stats.hourlyActivity.reduce((a, b) => a + b, 0);
        if (total === 0) return 0;
        return Math.round((lateHours / total) * 100);
    },

    getMonthlyVelocity: (): [string, number][] => {
        const { stats } = statsStore.getState();
        const months: Record<string, number> = {};
        Object.entries(stats.dailyHistory || {}).forEach(([date, mins]) => {
            const m = date.substring(0, 7); // YYYY-MM
            months[m] = (months[m] || 0) + Math.round(Number(mins) / 60); 
        });
        return Object.entries(months).sort().slice(-6);
    },

    getCompletionRate: (): number => {
        const allTasks = getAllTasks();
        return allTasks.length > 0 ? Math.round((allTasks.filter(t => t.completed).length / allTasks.length) * 100) : 0;
    },

    getDistMax: (): number => {
        const { stats } = statsStore.getState();
        const values = Object.values(stats.categoryDist || { "General": 0 }) as number[];
        return Math.max(...values, 1);
    }
};