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
    default:
      return <Sparkles {...props} />
  }
}
