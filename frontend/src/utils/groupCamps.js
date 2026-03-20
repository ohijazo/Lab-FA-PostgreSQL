export function groupCamps(camps) {
  const groups = []
  let currentGrup = null
  let currentCamps = []

  for (const camp of camps) {
    const grup = camp.grup || ''
    if (grup !== currentGrup) {
      if (currentCamps.length > 0) {
        groups.push({ grup: currentGrup, camps: currentCamps })
      }
      currentGrup = grup
      currentCamps = [camp]
    } else {
      currentCamps.push(camp)
    }
  }
  if (currentCamps.length > 0) {
    groups.push({ grup: currentGrup, camps: currentCamps })
  }
  return groups
}
