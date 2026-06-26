#!/usr/bin/env node
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    try {
        const parts = [];
        const data = JSON.parse(input);
        const model = data.model.display_name;
        const effort = data.effort?.level;

        const pct = Math.floor(data.context_window?.used_percentage || 0);
        const filled = Math.floor(pct * 10 / 100);
        let bar = '▓'.repeat(filled) + '░'.repeat(10 - filled);
        if (data.context_window.total_input_tokens >= 100_000) {
            bar = `\x1b[31m${bar}\x1b[0m`;
        } else if (data.context_window.total_input_tokens >= 80_000) {
            bar = `\x1b[33m${bar}\x1b[0m`;
        }

        const cost = data.cost?.total_cost_usd || 0;
        const durationMs = data.cost?.total_duration_ms || 0;
        const durationSec = Math.floor(durationMs / 1000);
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;


        const fiveH = data.rate_limits?.five_hour?.used_percentage;
        const fiveHResetsAt = data.rate_limits?.five_hour?.resets_at;
        const week = data.rate_limits?.seven_day?.used_percentage;

        if (week != null) parts.push(`7d: ${Math.round(week)}%`);
        if (fiveH != null && fiveHResetsAt != null) {
            const fiveHSeconds = 5 * 3600;
            const now = Math.floor(Date.now() / 1000);
            const remaining = Math.max(0, fiveHResetsAt - now);
            const elapsedSeconds = fiveHSeconds - remaining;

            const currentHour = Math.min(5, Math.floor(elapsedSeconds / 3600) + 1);
            const hourBudget = currentHour * 20;

            const hours = Math.floor(remaining / 3600);
            const mins = Math.floor((remaining % 3600) / 60);

            const diff = Math.round(fiveH) - hourBudget;
            const diffStr = diff > 0 ? `+${diff}%` : `${diff}%`;
            const budgetColor = diff > 0 ? '\x1b[31m' : '\x1b[32m';
            const resetColor = '\x1b[0m';

            parts.push(`5h: ${Math.round(fiveH)}% [${budgetColor}h${currentHour}: ${hourBudget}% (${diffStr})${resetColor}] (resets in ${hours}h${mins}m)`);
        }

        const usedK = Math.round(data.context_window.total_input_tokens / 1000);
        const totalK = data.context_window.context_window_size / 1000;
        parts.unshift(`${bar} (${usedK}k/${totalK}k)`);

        const orange = '\x1b[38;5;214m';
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        const effortColors = {
            low:    '\x1b[38;5;218m',
            medium: '\x1b[92m',
            high:   '\x1b[94m',
            xhigh:  '\x1b[38;5;183m',
            max:    '\x1b[31m',
        };

        const coloredModel = `${orange}${model}${reset}`;
        const effortColor = effort ? (effortColors[effort] || '') : '';
        const coloredEffort = effort ? ` (${bold}${effortColor}${effort}${reset})` : '';

        const home = process.env.HOME || '';
        const cwd = process.cwd().replace(home, '~');
        const lightBlue = '\x1b[94m';
        const coloredCwd = `${lightBlue}${cwd}${reset}`;

        console.log(`[${coloredModel}${coloredEffort}] [${coloredCwd}] ${parts.join(' | ')}`);
    } catch (error) {
        console.log('Error constructing statusline: ', error);
    }
});
