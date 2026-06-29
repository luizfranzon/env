#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RTK_CACHE = path.join(os.tmpdir(), 'rtk-statusline-cache.json');
const RTK_TTL = 10_000;

const C = {
    reset:  '\x1b[0m',
    bold:   '\x1b[1m',
    red:    '\x1b[91m',
    green:  '\x1b[92m',
    yellow: '\x1b[93m',
    blue:   '\x1b[94m',
    cyan:   '\x1b[96m',
    orange: '\x1b[38;5;214m',
    pink:   '\x1b[38;5;218m',
    purple: '\x1b[38;5;183m',
};

const EFFORT_COLORS = {
    low:    C.pink,
    medium: C.green,
    high:   C.blue,
    xhigh:  C.purple,
    max:    C.red,
};

const pctColor = p => p <= 50 ? C.green : p <= 80 ? C.yellow : C.red;

function getRtkStats() {
    try {
        const st = fs.statSync(RTK_CACHE);
        if (Date.now() - st.mtimeMs < RTK_TTL) {
            return JSON.parse(fs.readFileSync(RTK_CACHE, 'utf8')).summary || null;
        }
    } catch {}
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
        const data = JSON.parse(input);
        const parts = [];

        const pct    = Math.floor(data.context_window?.used_percentage || 0);
        const filled = Math.floor(pct / 10);
        let bar = '▓'.repeat(filled) + '░'.repeat(10 - filled);
        if (pct >= 85)      bar = `${C.red}${bar}${C.reset}`;
        else if (pct >= 70) bar = `${C.yellow}${bar}${C.reset}`;

        const usedK  = Math.round((data.context_window?.total_input_tokens || 0) / 1000);
        const totalK = (data.context_window?.context_window_size || 0) / 1000;

        const rtk = getRtkStats();
        const rtkStr = rtk
            ? ` (${C.cyan}↑${Math.round(rtk.total_input / 1000)}k${C.reset} ${C.yellow}↓${Math.round(rtk.total_output / 1000)}k${C.reset} ${C.green}♺ ${Math.round(rtk.total_saved / 1000)}k (${Math.round(rtk.avg_savings_pct)}%)${C.reset})`
            : '';
        parts.push(`${bar} (${usedK}k/${totalK}k)${rtkStr}`);

        const week          = data.rate_limits?.seven_day?.used_percentage;
        const fiveH         = data.rate_limits?.five_hour?.used_percentage;
        const fiveHResetsAt = data.rate_limits?.five_hour?.resets_at;

        if (week != null) {
            const w = Math.round(week);
            parts.push(`${C.bold}7d:${C.reset} ${pctColor(w)}${w}%${C.reset}`);
        }

        if (fiveH != null && fiveHResetsAt != null) {
            const now         = Math.floor(Date.now() / 1000);
            const remaining   = Math.max(0, fiveHResetsAt - now);
            const elapsed     = 5 * 3600 - remaining;
            const currentHour = Math.min(5, Math.floor(elapsed / 3600) + 1);
            const hourBudget  = currentHour * 20;

            const fh       = Math.round(fiveH);
            const diff     = fh - hourBudget;
            const diffStr  = diff > 0 ? `+${diff}%` : `${diff}%`;
            const diffColor = diff > 0 ? C.red : C.green;

            const hours     = Math.floor(remaining / 3600);
            const mins      = Math.floor((remaining % 3600) / 60);
            const resetTime = new Date(fiveHResetsAt * 1000)
                .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

            parts.push(`${C.bold}5h:${C.reset} ${pctColor(fh)}${fh}%${C.reset}/${hourBudget}% (${diffColor}${diffStr}${C.reset})`);
            parts.push(`resets in ${hours}h${mins}m @ ${resetTime}`);
        }

        const model  = data.model?.display_name || '?';
        const effort = data.effort?.level;
        const effortStr = effort
            ? ` (${C.bold}${EFFORT_COLORS[effort] || ''}${effort}${C.reset})`
            : '';

        const cwd = process.cwd().replace(process.env.HOME || '', '~');

        console.log(`[${C.blue}${cwd}${C.reset}] · ${C.orange}${model}${C.reset}${effortStr} · ${parts.join(' · ')}`);
    } catch (error) {
        console.log('Error constructing statusline:', error);
    }
});
