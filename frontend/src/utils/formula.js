/*
 * Avaluador segur de fórmules per a camps calculats.
 *
 * Gramàtica suportada:
 *   expression := term (('+' | '-') term)*
 *   term       := factor (('*' | '/') factor)*
 *   factor     := '-' factor | atom
 *   atom       := number | identifier | identifier '(' args ')' | '(' expression ')'
 *   args       := expression (',' expression)*
 *
 * Funcions: min, max, abs, round (round(x) o round(x, n)).
 *
 * Notes:
 * - No usa eval() ni new Function(). Parser recursive descent propi.
 * - Decimal separator: només punt (els valors d'entrada amb coma es
 *   normalitzen a punt abans de resoldre).
 * - Valors absents/buits/no numèrics → NaN → resultat null.
 * - Divisió per zero → Infinity → resultat null.
 */

function tokenize(s) {
  const tokens = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/\s/.test(c)) { i++; continue }
    if (/\d/.test(c) || (c === '.' && /\d/.test(s[i + 1] || ''))) {
      let j = i
      while (j < s.length && /[\d.]/.test(s[j])) j++
      tokens.push({ t: 'num', v: parseFloat(s.slice(i, j)) })
      i = j
    } else if (/[a-zA-Z_]/.test(c)) {
      let j = i
      while (j < s.length && /[a-zA-Z0-9_]/.test(s[j])) j++
      tokens.push({ t: 'id', v: s.slice(i, j) })
      i = j
    } else if ('+-*/(),'.includes(c)) {
      tokens.push({ t: c })
      i++
    } else {
      throw new Error(`Caràcter no vàlid: ${c}`)
    }
  }
  return tokens
}

function Parser(tokens, values) {
  this.tokens = tokens
  this.values = values
  this.pos = 0
}
Parser.prototype.peek = function () { return this.tokens[this.pos] }
Parser.prototype.consume = function () { return this.tokens[this.pos++] }

Parser.prototype.parseExpression = function () {
  let left = this.parseTerm()
  while (this.peek() && (this.peek().t === '+' || this.peek().t === '-')) {
    const op = this.consume().t
    const right = this.parseTerm()
    left = op === '+' ? left + right : left - right
  }
  return left
}

Parser.prototype.parseTerm = function () {
  let left = this.parseFactor()
  while (this.peek() && (this.peek().t === '*' || this.peek().t === '/')) {
    const op = this.consume().t
    const right = this.parseFactor()
    left = op === '*' ? left * right : left / right
  }
  return left
}

Parser.prototype.parseFactor = function () {
  if (this.peek() && this.peek().t === '-') {
    this.consume()
    return -this.parseFactor()
  }
  if (this.peek() && this.peek().t === '+') {
    this.consume()
    return this.parseFactor()
  }
  return this.parseAtom()
}

Parser.prototype.parseAtom = function () {
  const tok = this.consume()
  if (!tok) throw new Error('Fi inesperat')
  if (tok.t === 'num') return tok.v
  if (tok.t === '(') {
    const v = this.parseExpression()
    const next = this.consume()
    if (!next || next.t !== ')') throw new Error('S\'esperava )')
    return v
  }
  if (tok.t === 'id') {
    if (this.peek() && this.peek().t === '(') {
      this.consume() // (
      const args = []
      if (this.peek() && this.peek().t !== ')') {
        args.push(this.parseExpression())
        while (this.peek() && this.peek().t === ',') {
          this.consume()
          args.push(this.parseExpression())
        }
      }
      const close = this.consume()
      if (!close || close.t !== ')') throw new Error('S\'esperava )')
      return this.callFn(tok.v, args)
    }
    return this.resolve(tok.v)
  }
  throw new Error('Token inesperat')
}

Parser.prototype.resolve = function (name) {
  const v = this.values[name]
  if (v === undefined || v === null || v === '') return NaN
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'number') return v
  const num = parseFloat(String(v).replace(',', '.'))
  return num
}

Parser.prototype.callFn = function (name, args) {
  const n = name.toLowerCase()
  if (args.some((a) => !Number.isFinite(a))) return NaN
  switch (n) {
    case 'min': return Math.min(...args)
    case 'max': return Math.max(...args)
    case 'abs': return Math.abs(args[0])
    case 'round': {
      const decs = args.length > 1 ? Math.floor(args[1]) : 0
      const k = Math.pow(10, decs)
      return Math.round(args[0] * k) / k
    }
    default:
      throw new Error(`Funció desconeguda: ${name}`)
  }
}

/**
 * Avalua una fórmula. Retorna número o `null` si no es pot calcular.
 */
export function evaluateFormula(formula, values) {
  if (!formula || !String(formula).trim()) return null
  try {
    const tokens = tokenize(String(formula))
    if (tokens.length === 0) return null
    const parser = new Parser(tokens, values || {})
    const result = parser.parseExpression()
    if (parser.pos !== tokens.length) return null
    return Number.isFinite(result) ? result : null
  } catch (_) {
    return null
  }
}

/**
 * Arrodoneix a 4 decimals com a màxim, sense afegir zeros.
 */
export function roundDisplay(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return ''
  return parseFloat(Number(v).toFixed(4))
}

/**
 * Recalcula tots els camps amb fórmula iterativament fins a estabilitzar
 * (per gestionar fórmules que depenen d'altres camps calculats).
 *
 * Retorna una còpia de `values` amb els camps calculats actualitzats.
 */
export function recomputeFormulas(seccions, values) {
  const result = { ...values }
  const formulaCamps = []
  for (const s of seccions || []) {
    for (const c of s.camps || []) {
      if (c.formula && c.formula.trim()) formulaCamps.push(c)
    }
  }
  if (formulaCamps.length === 0) return result

  for (let iter = 0; iter < 20; iter++) {
    let changed = false
    for (const c of formulaCamps) {
      const v = evaluateFormula(c.formula, result)
      const next = v === null ? '' : roundDisplay(v)
      const prev = result[c.name]
      // Compara amb tolerància per evitar bucles per float drift
      if (next === '' || prev === '' || prev === undefined || prev === null) {
        if (prev !== next) {
          result[c.name] = next
          changed = true
        }
      } else if (typeof next === 'number' && typeof prev !== 'number') {
        result[c.name] = next
        changed = true
      } else if (Math.abs(Number(next) - Number(prev)) > 1e-9) {
        result[c.name] = next
        changed = true
      }
    }
    if (!changed) break
  }
  return result
}
