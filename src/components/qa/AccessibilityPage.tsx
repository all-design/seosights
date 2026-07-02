'use client'

import { motion } from 'framer-motion'
import {
  Eye,
  CheckCircle2,
  XCircle,
  Keyboard,
  Contrast,
  Accessibility,
  Volume2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ── Mock Data ──────────────────────────────────────────────────────────

const wcagChecklist = [
  { criterion: '1.1.1 Non-text Content', status: 'fail', detail: '12 images missing alt text' },
  { criterion: '1.3.1 Info and Relationships', status: 'pass', detail: 'Headings and landmarks properly structured' },
  { criterion: '1.4.3 Contrast (Minimum)', status: 'fail', detail: '3 text elements below 4.5:1 ratio' },
  { criterion: '1.4.11 Non-text Contrast', status: 'pass', detail: 'UI components meet 3:1 contrast' },
  { criterion: '2.1.1 Keyboard', status: 'fail', detail: '5 interactive elements not keyboard accessible' },
  { criterion: '2.1.2 No Keyboard Trap', status: 'pass', detail: 'No keyboard traps detected' },
  { criterion: '2.4.1 Bypass Blocks', status: 'pass', detail: 'Skip navigation link present' },
  { criterion: '2.4.3 Focus Order', status: 'fail', detail: 'Focus order incorrect in modal dialogs' },
  { criterion: '2.4.6 Headings and Labels', status: 'pass', detail: 'Headings properly nested' },
  { criterion: '2.4.7 Focus Visible', status: 'fail', detail: 'Custom focus styles missing on 8 elements' },
  { criterion: '3.1.1 Language of Page', status: 'pass', detail: 'Lang attribute set correctly' },
  { criterion: '3.2.2 On Input', status: 'pass', detail: 'No unexpected context changes on input' },
  { criterion: '4.1.1 Parsing', status: 'pass', detail: 'No duplicate IDs or parsing errors' },
  { criterion: '4.1.2 Name, Role, Value', status: 'fail', detail: '3 custom widgets missing ARIA roles' },
]

const keyboardIssues = [
  { element: 'Dropdown menu', issue: 'Cannot be opened with Enter or Space', location: 'Navigation bar' },
  { element: 'Modal close button', issue: 'Focus is trapped after closing modal', location: 'All modals' },
  { element: 'Tab panels', issue: 'Arrow keys don\'t switch between tabs', location: 'Dashboard' },
  { element: 'Date picker', issue: 'Not keyboard navigable at all', location: 'Settings page' },
  { element: 'Tooltip triggers', issue: 'No keyboard way to show tooltips', location: 'Feature cards' },
]

const contrastIssues = [
  { element: 'Footer links', foreground: '#71717a', background: '#18181b', ratio: '2.8:1', required: '4.5:1', level: 'AA' },
  { element: 'Placeholder text', foreground: '#a1a1aa', background: '#27272a', ratio: '3.1:1', required: '4.5:1', level: 'AA' },
  { element: 'Secondary buttons', foreground: '#a1a1aa', background: '#3f3f46', ratio: '2.5:1', required: '3:1', level: 'AA Non-text' },
]

const ariaIssues = [
  { element: 'Custom dropdown', issue: 'Missing role="listbox" and aria-expanded', severity: 'major' },
  { element: 'Loading spinner', issue: 'Missing aria-label or role="status"', severity: 'major' },
  { element: 'Accordion panels', issue: 'aria-controls and aria-expanded mismatched', severity: 'medium' },
  { element: 'Toast notifications', issue: 'Missing role="alert" and aria-live region', severity: 'major' },
  { element: 'Progress bars', issue: 'Missing aria-valuenow, aria-valuemin, aria-valuemax', severity: 'medium' },
]

const screenReaderResults = [
  { test: 'Page title announced', result: 'pass', detail: 'All pages have descriptive titles' },
  { test: 'Heading structure navigable', result: 'pass', detail: 'H1→H2→H3 structure is logical' },
  { test: 'Form labels associated', result: 'fail', detail: '3 form fields have no associated label' },
  { test: 'Image alt text present', result: 'fail', detail: '12 images missing alt text' },
  { test: 'Link text descriptive', result: 'pass', detail: 'No "click here" or "read more" links' },
  { test: 'Table headers associated', result: 'pass', detail: 'Data tables have proper headers' },
  { test: 'Dynamic content announced', result: 'fail', detail: 'AJAX content changes not announced' },
  { test: 'Error messages accessible', result: 'fail', detail: 'Form errors not linked to fields via aria-describedby' },
]

// ── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Main Accessibility Page ────────────────────────────────────────────

export function AccessibilityPage() {
  const passCount = wcagChecklist.filter(c => c.status === 'pass').length
  const failCount = wcagChecklist.filter(c => c.status === 'fail').length

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Score ────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <Eye className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Accessibility Score</p>
                <span className="text-5xl font-bold text-amber-400 tracking-tighter">83</span>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="text-center">
                  <span className="text-xl font-bold text-emerald-400">{passCount}</span>
                  <p className="text-[10px] text-zinc-500">Passed</p>
                </div>
                <div className="text-center">
                  <span className="text-xl font-bold text-red-400">{failCount}</span>
                  <p className="text-[10px] text-zinc-500">Failed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── WCAG Checklist ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">WCAG 2.1 AA Checklist</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">{passCount} of {wcagChecklist.length} criteria passed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Progress value={(passCount / wcagChecklist.length) * 100} className="h-2 bg-zinc-800 [&>div]:bg-amber-500" />
            </div>
            <div className="space-y-1">
              {wcagChecklist.map((item) => (
                <div key={item.criterion} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                  {item.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="text-xs text-zinc-300 font-mono flex-1">{item.criterion}</span>
                  <span className="text-[10px] text-zinc-500 hidden sm:inline max-w-[200px] truncate">{item.detail}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Keyboard Navigation + Color Contrast Row ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Keyboard Navigation */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Keyboard Navigation</CardTitle>
              </div>
              <CardDescription className="text-[11px] text-zinc-600">{keyboardIssues.length} keyboard accessibility issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {keyboardIssues.map((issue, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="text-xs font-medium text-zinc-300">{issue.element}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 ml-5">{issue.issue}</p>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border border-zinc-700 text-zinc-500 bg-zinc-800/50 ml-5 mt-1">
                      {issue.location}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Color Contrast */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Contrast className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Color Contrast</CardTitle>
              </div>
              <CardDescription className="text-[11px] text-zinc-600">{contrastIssues.length} contrast issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contrastIssues.map((issue, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-zinc-300">{issue.element}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border text-red-400 bg-red-500/10 border-red-500/20">
                        Fail
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-zinc-500">Ratio: <span className="text-red-400 font-mono">{issue.ratio}</span></span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-zinc-500">Required: <span className="text-emerald-400 font-mono">{issue.required}</span></span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-zinc-500">Level: {issue.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── ARIA Issues + Screen Reader Results Row ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ARIA Issues */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">ARIA Issues</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ariaIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-zinc-300">{issue.element}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{issue.issue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Screen Reader Results */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Screen Reader Test</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {screenReaderResults.map((test, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                    {test.result === 'pass' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span className="text-xs text-zinc-300 flex-1">{test.test}</span>
                    <span className="text-[10px] text-zinc-500 hidden sm:inline max-w-[180px] truncate">{test.detail}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
