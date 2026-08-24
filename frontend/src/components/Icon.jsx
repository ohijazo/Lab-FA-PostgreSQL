import {
  AlertCircle, AlertTriangle, ArrowDown, ArrowLeft, ArrowUp,
  BarChart3, Bell, BellOff, CalendarClock, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronRight, ChevronsUpDown, Circle, Clock, Columns3, Copy,
  Download, Eye, EyeOff, FileDown, Filter, FlaskConical, GripVertical,
  HelpCircle, Inbox, Info, Languages, Layers, LayoutList, List, Loader2,
  Lock, LogIn, LogOut, Mail, Moon, Pencil, Plus, Printer, RefreshCw,
  Ruler, Save, Search, ShieldCheck, Sigma, SlidersHorizontal, Sun,
  Table2, Trash2, Upload, UserPlus, Users, X,
} from 'lucide-react'

// Whitelist explícita per permetre tree-shaking de Vite (evita import * as Lucide
// que fa entrar ~1MB del paquet sencer al bundle). Si cal una icona nova, afegeix
// el nom aquí i al mapa `icons`.
const icons = {
  AlertCircle, AlertTriangle, ArrowDown, ArrowLeft, ArrowUp,
  BarChart3, Bell, BellOff, CalendarClock, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronRight, ChevronsUpDown, Circle, Clock, Columns3, Copy,
  Download, Eye, EyeOff, FileDown, Filter, FlaskConical, GripVertical,
  HelpCircle, Inbox, Info, Languages, Layers, LayoutList, List, Loader2,
  Lock, LogIn, LogOut, Mail, Moon, Pencil, Plus, Printer, RefreshCw,
  Ruler, Save, Search, ShieldCheck, Sigma, SlidersHorizontal, Sun,
  Table2, Trash2, Upload, UserPlus, Users, X,
}

export default function Icon({ name, size = 16, strokeWidth = 2, className, ...rest }) {
  const Cmp = icons[name]
  if (!Cmp) {
    if (import.meta.env.DEV && name) {
      console.warn(`[Icon] "${name}" no és a la whitelist. Afegeix-lo a Icon.jsx.`)
    }
    return null
  }
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" {...rest} />
}
