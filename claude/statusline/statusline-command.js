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
    gray:   '\x1b[38;5;245m',
    white:  '\x1b[97m',
};

const EFFORT_COLORS = {
    low:    C.pink,
    medium: C.green,
    high:   C.blue,
    xhigh:  C.purple,
    max:    C.red,
};

const pctColor = p => p <= 50 ? C.green : p <= 80 ? C.yellow : C.red;

function getGitBranch(cwd) {
    try {
        return execSync('git branch --show-current', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
    } catch {
        return null;
    }
}

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
        const usedK  = Math.round((data.context_window?.total_input_tokens || 0) / 1000);
        const totalK = (data.context_window?.context_window_size || 0) / 1000;

        const ctxColor = usedK >= 100 ? C.red : usedK >= 80 ? C.orange : '';
        const filled = Math.floor(pct / 10);
        const bar = ctxColor
            ? `${ctxColor}${'▓'.repeat(filled)}${'░'.repeat(10 - filled)}${C.reset}`
            : '▓'.repeat(filled) + '░'.repeat(10 - filled);
        const ctxLabel = ctxColor
            ? `${ctxColor}(${usedK}k/${totalK}k)${C.reset}`
            : `(${usedK}k/${totalK}k)`;

        const rtk = getRtkStats();
        const rtkStr = rtk
            ? `${C.cyan}↑${Math.round(rtk.total_input / 1000)}k${C.reset} ${C.yellow}↓${Math.round(rtk.total_output / 1000)}k${C.reset} ${C.green}♺ ${Math.round(rtk.total_saved / 1000)}k (${Math.round(rtk.avg_savings_pct)}%)${C.reset}`
            : '';

        const barCtxGroup = `${bar} ${ctxLabel}`;

        const week          = data.rate_limits?.seven_day?.used_percentage;
        const fiveH         = data.rate_limits?.five_hour?.used_percentage;
        const fiveHResetsAt = data.rate_limits?.five_hour?.resets_at;

        const pctParts = [];
        if (week != null) {
            const w = Math.round(week);
            pctParts.push(`${C.bold}7d:${C.reset} ${pctColor(w)}${w}%${C.reset}`);
        }

        let resetsStr = '';
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

            pctParts.push(`${C.bold}5h:${C.reset} ${pctColor(fh)}${fh}%${C.reset}/${hourBudget}% (${diffColor}${diffStr}${C.reset})`);
            resetsStr = `resets in ${hours}h${mins}m @ ${resetTime}`;
        }
        const pctGroup = pctParts.length ? `(${pctParts.join(' ')})` : '';

        const model  = data.model?.display_name || '?';
        const effort = data.effort?.level;
        const effortStr = effort
            ? ` (${C.bold}${EFFORT_COLORS[effort] || ''}${effort}${C.reset})`
            : '';

        const cwd = process.cwd();
        const projectName = path.basename(cwd);
        const branch = getGitBranch(cwd);
        const projectStr = branch
            ? `${C.blue}${projectName}${C.reset} @ ${C.cyan}${branch}${C.reset}`
            : `${C.blue}${projectName}${C.reset}`;

        parts.push(`${projectStr}`);
        parts.push(`${C.orange}${model}${C.reset}${effortStr} ${barCtxGroup}`);
        if (pctGroup) parts.push(pctGroup);
        if (resetsStr) parts.push(resetsStr);
        if (rtkStr) parts.push(`(${rtkStr})`);

        console.log(parts.join(` ${C.white}·${C.reset} `));
    } catch (error) {
        console.log('Error constructing statusline:', error);
    }
});
