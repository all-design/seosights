import {
  Eye,
  FileText,
  Code,
  Bot,
  Search,
  Globe,
  MessageSquare,
  Sparkles,
  Network,
  Link2,
  Quote,
  TrendingUp,
  Gauge,
  Target,
  BarChart3,
  ShieldCheck,
  ListChecks,
  HelpCircle,
  Tag,
  Calculator,
  BookOpen,
  Brain,
  type LucideProps,
} from 'lucide-react'

/**
 * IconRenderer — statically maps a lucide icon name (stored in our data files)
 * to the actual icon component via a switch statement. This avoids the
 * `react-hooks/static-components` lint error that flags any dynamic component
 * lookup during render.
 *
 * To add a new icon, add a case here AND import it above.
 */
export default function IconRenderer({ name, ...props }: { name: string } & LucideProps) {
  switch (name) {
    case 'Eye':
      return <Eye {...props} />
    case 'FileText':
      return <FileText {...props} />
    case 'Code':
      return <Code {...props} />
    case 'Bot':
      return <Bot {...props} />
    case 'Search':
      return <Search {...props} />
    case 'Globe':
      return <Globe {...props} />
    case 'MessageSquare':
      return <MessageSquare {...props} />
    case 'Network':
      return <Network {...props} />
    case 'Sparkles':
      return <Sparkles {...props} />
    case 'Link2':
      return <Link2 {...props} />
    case 'Quote':
      return <Quote {...props} />
    case 'TrendingUp':
      return <TrendingUp {...props} />
    case 'Gauge':
      return <Gauge {...props} />
    case 'Target':
      return <Target {...props} />
    case 'BarChart3':
      return <BarChart3 {...props} />
    case 'ShieldCheck':
      return <ShieldCheck {...props} />
    case 'ListChecks':
      return <ListChecks {...props} />
    case 'HelpCircle':
      return <HelpCircle {...props} />
    case 'Tag':
      return <Tag {...props} />
    case 'Calculator':
      return <Calculator {...props} />
    case 'BookOpen':
      return <BookOpen {...props} />
    case 'Brain':
      return <Brain {...props} />
    default:
      return <Sparkles {...props} />
  }
}
