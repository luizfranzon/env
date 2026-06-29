#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RTK_CACHE = path.join(os.tmpdir(), 'rtk-statusline-cache.json');
const RTK_TTL = 10_000;

function getRtkStats() {
    try {
        const st = fs.statSync(RTK_CACHE);
        if (Date.now() - st.mtimeMs < RTK_TTL) {
            return JSON.parse(fs.readFileSync(RTK_CACHE, 'utf8')).summary || null;
        }
    } catch { /* sem cache válido, segue para re-executar */ }
    try {
        const out = execSync('rtk gain --format json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        fs.writeFileSync(RTK_CACHE, out);
        return JSON.parse(out).summary || null;
    } catch {
        return null;
    }
}

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    try {
        const parts = [];
        const data = JSON.parse(input);
        const model = data.model?.display_name || '?';
        const effort = data.effort?.level;

        const pct = Math.floor(data.context_window?.used_percentage || 0);
        const filled = Math.floor(pct * 10 / 100);
        let bar = '▓'.repeat(filled) + '░'.repeat(10 - filled);
        if (pct >= 85) {
            bar = `\x1b[31m${bar}\x1b[0m`;
        } else if (pct >= 70) {
            bar = `\x1b[33m${bar}\x1b[0m`;
        }

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

            const resetDate = new Date(fiveHResetsAt * 1000);
            const resetTime = resetDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
            parts.push(`5h: ${Math.round(fiveH)}% [${budgetColor}h${currentHour}: ${hourBudget}% (${diffStr})${resetColor}] (resets in ${hours}h${mins}m @ ${resetTime})`);
        }

        const usedK = Math.round((data.context_window?.total_input_tokens || 0) / 1000);
        const totalK = (data.context_window?.context_window_size || 0) / 1000;

        const cyan  = '\x1b[96m';
        const yellow = '\x1b[93m';
        const green  = '\x1b[92m';
        const r      = '\x1b[0m';

        const rtk = getRtkStats();
        const rtkStr = rtk
            ? ` (${cyan}↑${Math.round(rtk.total_input / 1000)}k${r} ${yellow}↓${Math.round(rtk.total_output / 1000)}k${r} ${green}♺ ${Math.round(rtk.total_saved / 1000)}k (${Math.round(rtk.avg_savings_pct)}%)${r})`
            : '';

        parts.unshift(`${bar} (${usedK}k/${totalK}k)${rtkStr}`);

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

        console.log(`${coloredModel}${coloredEffort} [${coloredCwd}] ${parts.join(' | ')}`);
    } catch (error) {
        console.log('Error constructing statusline: ', error);
    }
});
