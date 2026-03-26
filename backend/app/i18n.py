from flask import request

TRANSLATIONS = {
    'ca': {
        'no_autenticat': 'No autenticat',
        'acces_denegat': 'Accés denegat',
        'acces_lectura': 'Accés de només lectura',
        'credencials_incorrectes': 'Credencials incorrectes',
        'tipus_no_trobat': "Tipus '{slug}' no trobat",
        'codi_obligatori': 'codi es obligatori',
        'no_trobat': 'No trobat',
        'ja_existeix_codi': "Ja existeix una anàlisi amb codi '{codi}' en aquest tipus",
        'conflicte_concurrencia': "Registre modificat per {user} des que l'has obert.",
        'cal_seleccionar_tipus': 'Cal seleccionar almenys un tipus',
        'cap_tipus_trobat': 'Cap tipus trobat',
        'nom_obligatori': 'El nom es obligatori',
        'ja_existeix_slug': "Ja existeix un tipus amb slug '{slug}'",
        'no_canviar_slug': "No es pot canviar el slug perque hi ha {n} analisis vinculades",
        'slug_ja_existeix': "El slug '{slug}' ja existeix",
        'no_eliminar_analisis': "No es pot eliminar: hi ha {n} analisi(s) vinculades a aquest tipus",
        'no_eliminar_seccio': "No es pot eliminar: hi ha {n} analisi(s) vinculades al tipus '{nom}'",
        'no_eliminar_camp': "No es pot eliminar: hi ha {n} analisi(s) vinculades al tipus '{nom}'",
        'titol_obligatori': 'El titol es obligatori',
        'name_label_obligatoris': 'name i label son obligatoris',
        'email_password_obligatoris': 'email i password son obligatoris',
        'nom_obligatori_user': 'El nom es obligatori',
        'role_invalid': "role ha de ser 'admin', 'user' o 'viewer'",
        'ja_existeix_email': "Ja existeix un usuari amb email '{email}'",
        'no_eliminar_propi': 'No pots eliminar el teu propi usuari',
        'tipus_sense_camps': 'Aquest tipus no te camps configurats',
        'no_fitxer': "No s'ha enviat cap fitxer",
        'fitxer_format': 'El fitxer ha de ser .xlsx o .xls',
        'no_llegir_excel': "No s'ha pogut llegir el fitxer Excel",
        'fitxer_sense_dades': 'El fitxer no te dades (nomes capçalera o buit)',
        'cap_columna_coincideix': "Cap columna de l'Excel coincideix amb els camps del tipus",
        'camp_obligatori_buit': "Camp obligatori '{label}' buit",
        'valor_no_numeric': "Camp '{label}': valor '{val}' no es numeric",
    },
    'es': {
        'no_autenticat': 'No autenticado',
        'acces_denegat': 'Acceso denegado',
        'acces_lectura': 'Acceso de solo lectura',
        'credencials_incorrectes': 'Credenciales incorrectas',
        'tipus_no_trobat': "Tipo '{slug}' no encontrado",
        'codi_obligatori': 'código es obligatorio',
        'no_trobat': 'No encontrado',
        'ja_existeix_codi': "Ya existe un análisis con código '{codi}' en este tipo",
        'conflicte_concurrencia': "Registro modificado por {user} desde que lo abriste.",
        'cal_seleccionar_tipus': 'Debe seleccionar al menos un tipo',
        'cap_tipus_trobat': 'Ningún tipo encontrado',
        'nom_obligatori': 'El nombre es obligatorio',
        'ja_existeix_slug': "Ya existe un tipo con slug '{slug}'",
        'no_canviar_slug': "No se puede cambiar el slug porque hay {n} análisis vinculados",
        'slug_ja_existeix': "El slug '{slug}' ya existe",
        'no_eliminar_analisis': "No se puede eliminar: hay {n} análisis vinculado(s) a este tipo",
        'no_eliminar_seccio': "No se puede eliminar: hay {n} análisis vinculado(s) al tipo '{nom}'",
        'no_eliminar_camp': "No se puede eliminar: hay {n} análisis vinculado(s) al tipo '{nom}'",
        'titol_obligatori': 'El título es obligatorio',
        'name_label_obligatoris': 'name y label son obligatorios',
        'email_password_obligatoris': 'email y password son obligatorios',
        'nom_obligatori_user': 'El nombre es obligatorio',
        'role_invalid': "role debe ser 'admin', 'user' o 'viewer'",
        'ja_existeix_email': "Ya existe un usuario con email '{email}'",
        'no_eliminar_propi': 'No puedes eliminar tu propio usuario',
        'tipus_sense_camps': 'Este tipo no tiene campos configurados',
        'no_fitxer': 'No se ha enviado ningún archivo',
        'fitxer_format': 'El archivo debe ser .xlsx o .xls',
        'no_llegir_excel': 'No se ha podido leer el archivo Excel',
        'fitxer_sense_dades': 'El archivo no tiene datos (solo cabecera o vacío)',
        'cap_columna_coincideix': 'Ninguna columna del Excel coincide con los campos del tipo',
        'camp_obligatori_buit': "Campo obligatorio '{label}' vacío",
        'valor_no_numeric': "Campo '{label}': valor '{val}' no es numérico",
    },
}


def get_lang():
    accept = request.headers.get('Accept-Language', 'ca')
    return 'es' if accept.startswith('es') else 'ca'


def t(key, **kwargs):
    lang = get_lang()
    msg = TRANSLATIONS[lang].get(key, TRANSLATIONS['ca'].get(key, key))
    return msg.format(**kwargs) if kwargs else msg
