import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Translation files
const translations = {
  en: {
    // Navigation
    'nav.legalEase': 'LegalEase AI',
    'nav.upload': 'Analyze Legal Documents',
    'nav.summary': 'Summary',
    'nav.clauses': 'Clauses',
    'nav.chat': 'Chat',
    
    // Upload
    'upload.title': 'In Seconds, Not Hours',
    'upload.description': 'Upload any legal document and instantly summarize, highlight key clauses, or chat with our AI for real-time insights and analysis.',
    'upload.button': 'Choose Document',
    'upload.uploading': 'Uploading…',
    'upload.success': 'Uploaded successfully',
    'upload.error': 'Failed to upload document',
    'upload.remove': 'Remove document',
    'upload.removed': 'Removed document',
    'upload.unsupported': 'Unsupported file format. Supported formats: {formats}',
    
    // Summary
    'summary.title': 'Summary',
    'summary.description': 'Clear and easy-to-understand summary',
    'summary.analysisIn': 'Analysis in {language}',
    'summary.generate': 'Generate Summary',
    'summary.generating': 'Summarizing…',
    'summary.noSummary': 'No summary yet.',
    'summary.copy': 'Copy',
    'summary.download': 'Download PDF',
    'summary.copied': 'Copied to clipboard',
    
    // Clauses
    'clauses.title': 'Clauses',
    'clauses.description': 'Analyze key clauses and their implications',
    'clauses.analyze': 'Analyze Clauses',
    'clauses.analyzing': 'Analyzing…',
    'clauses.noClauses': 'No clause analysis yet.',
    'clauses.safe': 'Safe',
    'clauses.caution': 'Caution',
    'clauses.risky': 'Risky',
    
    // Chat
    'chat.title': 'Chat',
    'chat.description': 'Ask questions about your document',
    'chat.placeholder': 'Ask a question about your document...',
    'chat.send': 'Send',
    'chat.sending': 'Sending…',
    'chat.noMessages': 'No messages yet.',
    
    // Common
    'common.uploadFirst': 'Upload a document first',
    'common.error': 'An error occurred',
    'common.loading': 'Loading...',
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    
    // Footer
    'footer.disclaimer': '⚠️ Not legal advice. This tool is a prototype for educational purposes.',
    
    // Language selector
    'language.selector': 'Language',
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'language.portuguese': 'Português',
    'language.russian': 'Русский',
    'language.chinese': '中文',
    'language.japanese': '日本語',
    'language.arabic': 'العربية',
    'language.hindi': 'हिन्दी',
  },
  
  es: {
    // Navigation
    'nav.legalEase': 'LegalEase AI',
    'nav.upload': 'Subir Documento',
    'nav.summary': 'Resumen',
    'nav.clauses': 'Cláusulas',
    'nav.chat': 'Chat',
    
    // Upload
    'upload.title': 'Subir un documento legal',
    'upload.description': 'Soporta PDF, DOC, DOCX e imágenes. Extraemos texto localmente a través del backend.',
    'upload.button': 'Elegir Documento',
    'upload.uploading': 'Subiendo…',
    'upload.success': 'Subido exitosamente',
    'upload.error': 'Error al subir documento',
    'upload.remove': 'Eliminar documento',
    'upload.removed': 'Documento eliminado',
    'upload.unsupported': 'Formato de archivo no soportado. Formatos soportados: {formats}',
    
    // Summary
    'summary.title': 'Resumen',
    'summary.description': 'Resumen claro y fácil de entender',
    'summary.analysisIn': 'Análisis en {language}',
    'summary.generate': 'Generar Resumen',
    'summary.generating': 'Generando…',
    'summary.noSummary': 'Aún no hay resumen.',
    'summary.copy': 'Copiar',
    'summary.download': 'Descargar PDF',
    'summary.copied': 'Copiado al portapapeles',
    
    // Clauses
    'clauses.title': 'Cláusulas',
    'clauses.description': 'Analiza cláusulas clave y sus implicaciones',
    'clauses.analyze': 'Analizar Cláusulas',
    'clauses.analyzing': 'Analizando…',
    'clauses.noClauses': 'Aún no hay análisis de cláusulas.',
    'clauses.safe': 'Seguro',
    'clauses.caution': 'Precaución',
    'clauses.risky': 'Riesgoso',
    
    // Chat
    'chat.title': 'Chat',
    'chat.description': 'Haz preguntas sobre tu documento',
    'chat.placeholder': 'Haz una pregunta sobre tu documento...',
    'chat.send': 'Enviar',
    'chat.sending': 'Enviando…',
    'chat.noMessages': 'Aún no hay mensajes.',
    
    // Common
    'common.uploadFirst': 'Sube un documento primero',
    'common.error': 'Ocurrió un error',
    'common.loading': 'Cargando...',
    'common.close': 'Cerrar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    
    // Footer
    'footer.disclaimer': '⚠️ No es asesoría legal. Esta herramienta es un prototipo con fines educativos.',
    
    // Language selector
    'language.selector': 'Idioma',
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'language.portuguese': 'Português',
    'language.russian': 'Русский',
    'language.chinese': '中文',
    'language.japanese': '日本語',
    'language.arabic': 'العربية',
    'language.hindi': 'हिन्दी',
  },
  
  fr: {
    // Navigation
    'nav.legalEase': 'LegalEase AI',
    'nav.upload': 'Télécharger Document',
    'nav.summary': 'Résumé',
    'nav.clauses': 'Clauses',
    'nav.chat': 'Chat',
    
    // Upload
    'upload.title': 'Télécharger un document juridique',
    'upload.description': 'Supporte PDF, DOC, DOCX et images. Nous extrayons le texte localement via le backend.',
    'upload.button': 'Choisir Document',
    'upload.uploading': 'Téléchargement…',
    'upload.success': 'Téléchargé avec succès',
    'upload.error': 'Échec du téléchargement du document',
    'upload.remove': 'Supprimer document',
    'upload.removed': 'Document supprimé',
    'upload.unsupported': 'Format de fichier non supporté. Formats supportés: {formats}',
    
    // Summary
    'summary.title': 'Résumé',
    'summary.description': 'Résumé clair et facile à comprendre',
    'summary.analysisIn': 'Analyse en {language}',
    'summary.generate': 'Générer Résumé',
    'summary.generating': 'Génération…',
    'summary.noSummary': 'Pas encore de résumé.',
    'summary.copy': 'Copier',
    'summary.download': 'Télécharger PDF',
    'summary.copied': 'Copié dans le presse-papiers',
    
    // Clauses
    'clauses.title': 'Clauses',
    'clauses.description': 'Analyser les clauses clés et leurs implications',
    'clauses.analyze': 'Analyser Clauses',
    'clauses.analyzing': 'Analyse…',
    'clauses.noClauses': 'Pas encore d\'analyse de clauses.',
    'clauses.safe': 'Sûr',
    'clauses.caution': 'Attention',
    'clauses.risky': 'Risqué',
    
    // Chat
    'chat.title': 'Chat',
    'chat.description': 'Posez des questions sur votre document',
    'chat.placeholder': 'Posez une question sur votre document...',
    'chat.send': 'Envoyer',
    'chat.sending': 'Envoi…',
    'chat.noMessages': 'Pas encore de messages.',
    
    // Common
    'common.uploadFirst': 'Téléchargez un document d\'abord',
    'common.error': 'Une erreur s\'est produite',
    'common.loading': 'Chargement...',
    'common.close': 'Fermer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    
    // Footer
    'footer.disclaimer': '⚠️ Pas de conseil juridique. Cet outil est un prototype à des fins éducatives.',
    
    // Language selector
    'language.selector': 'Langue',
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'language.portuguese': 'Português',
    'language.russian': 'Русский',
    'language.chinese': '中文',
    'language.japanese': '日本語',
    'language.arabic': 'العربية',
    'language.hindi': 'हिन्दी',
  },
  
  de: {
    // Navigation
    'nav.legalEase': 'LegalEase AI',
    'nav.upload': 'Dokument Hochladen',
    'nav.summary': 'Zusammenfassung',
    'nav.clauses': 'Klauseln',
    'nav.chat': 'Chat',
    
    // Upload
    'upload.title': 'Rechtsdokument hochladen',
    'upload.description': 'Unterstützt PDF, DOC, DOCX und Bilder. Wir extrahieren Text lokal über das Backend.',
    'upload.button': 'Dokument Wählen',
    'upload.uploading': 'Hochladen…',
    'upload.success': 'Erfolgreich hochgeladen',
    'upload.error': 'Fehler beim Hochladen des Dokuments',
    'upload.remove': 'Dokument Entfernen',
    'upload.removed': 'Dokument entfernt',
    'upload.unsupported': 'Nicht unterstütztes Dateiformat. Unterstützte Formate: {formats}',
    
    // Summary
    'summary.title': 'Zusammenfassung',
    'summary.description': 'Klare und verständliche Zusammenfassung',
    'summary.analysisIn': 'Analyse auf {language}',
    'summary.generate': 'Zusammenfassung Generieren',
    'summary.generating': 'Generierung…',
    'summary.noSummary': 'Noch keine Zusammenfassung.',
    'summary.copy': 'Kopieren',
    'summary.download': 'PDF Herunterladen',
    'summary.copied': 'In Zwischenablage kopiert',
    
    // Clauses
    'clauses.title': 'Klauseln',
    'clauses.description': 'Analysieren Sie wichtige Klauseln und deren Auswirkungen',
    'clauses.analyze': 'Klauseln Analysieren',
    'clauses.analyzing': 'Analysierung…',
    'clauses.noClauses': 'Noch keine Klauselanalyse.',
    'clauses.safe': 'Sicher',
    'clauses.caution': 'Vorsicht',
    'clauses.risky': 'Risikoreich',
    
    // Chat
    'chat.title': 'Chat',
    'chat.description': 'Stellen Sie Fragen zu Ihrem Dokument',
    'chat.placeholder': 'Stellen Sie eine Frage zu Ihrem Dokument...',
    'chat.send': 'Senden',
    'chat.sending': 'Senden…',
    'chat.noMessages': 'Noch keine Nachrichten.',
    
    // Common
    'common.uploadFirst': 'Laden Sie zuerst ein Dokument hoch',
    'common.error': 'Ein Fehler ist aufgetreten',
    'common.loading': 'Laden...',
    'common.close': 'Schließen',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    
    // Footer
    'footer.disclaimer': '⚠️ Keine Rechtsberatung. Dieses Tool ist ein Prototyp für Bildungszwecke.',
    
    // Language selector
    'language.selector': 'Sprache',
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'language.portuguese': 'Português',
    'language.russian': 'Русский',
    'language.chinese': '中文',
    'language.japanese': '日本語',
    'language.arabic': 'العربية',
    'language.hindi': 'हिन्दी',
  },
  
  hi: {
    // Navigation
    'nav.legalEase': 'LegalEase AI',
    'nav.upload': 'कानूनी दस्तावेज़ों का विश्लेषण करें',
    'nav.summary': 'सारांश',
    'nav.clauses': 'धाराएं',
    'nav.chat': 'चैट',
    
    // Upload
    'upload.title': 'सेकंडों में, घंटों में नहीं',
    'upload.description': 'कोई भी कानूनी दस्तावेज़ अपलोड करें और तुरंत सारांश बनाएं, मुख्य धाराओं को हाइलाइट करें, या वास्तविक समय की अंतर्दृष्टि और विश्लेषण के लिए हमारे AI के साथ चैट करें।',
    'upload.button': 'दस्तावेज़ चुनें',
    'upload.uploading': 'अपलोड हो रहा है…',
    'upload.success': 'सफलतापूर्वक अपलोड किया गया',
    'upload.error': 'दस्तावेज़ अपलोड करने में विफल',
    'upload.remove': 'दस्तावेज़ हटाएं',
    'upload.removed': 'दस्तावेज़ हटा दिया गया',
    'upload.unsupported': 'असमर्थित फ़ाइल प्रारूप। समर्थित प्रारूप: {formats}',
    
    // Summary
    'summary.title': 'सारांश',
    'summary.description': 'स्पष्ट और समझने में आसान सारांश',
    'summary.analysisIn': '{language} में विश्लेषण',
    'summary.generate': 'सारांश जेनरेट करें',
    'summary.generating': 'जेनरेट हो रहा है…',
    'summary.noSummary': 'अभी तक कोई सारांश नहीं।',
    'summary.copy': 'कॉपी करें',
    'summary.download': 'PDF डाउनलोड करें',
    'summary.copied': 'क्लिपबोर्ड में कॉपी किया गया',
    
    // Clauses
    'clauses.title': 'धाराएं',
    'clauses.description': 'मुख्य धाराओं और उनके निहितार्थों का विश्लेषण करें',
    'clauses.analyze': 'धाराओं का विश्लेषण करें',
    'clauses.analyzing': 'विश्लेषण हो रहा है…',
    'clauses.noClauses': 'अभी तक कोई धारा विश्लेषण नहीं।',
    'clauses.safe': 'सुरक्षित',
    'clauses.caution': 'सावधानी',
    'clauses.risky': 'जोखिमपूर्ण',
    
    // Chat
    'chat.title': 'चैट',
    'chat.description': 'अपने दस्तावेज़ के बारे में प्रश्न पूछें',
    'chat.placeholder': 'अपने दस्तावेज़ के बारे में एक प्रश्न पूछें...',
    'chat.send': 'भेजें',
    'chat.sending': 'भेजा जा रहा है…',
    'chat.noMessages': 'अभी तक कोई संदेश नहीं।',
    
    // Common
    'common.uploadFirst': 'पहले एक दस्तावेज़ अपलोड करें',
    'common.error': 'एक त्रुटि हुई',
    'common.loading': 'लोड हो रहा है...',
    'common.close': 'बंद करें',
    'common.cancel': 'रद्द करें',
    'common.save': 'सहेजें',
    'common.delete': 'हटाएं',
    
    // Footer
    'footer.disclaimer': '⚠️ कानूनी सलाह नहीं। यह उपकरण शैक्षिक उद्देश्यों के लिए एक प्रोटोटाइप है।',
    
    // Language selector
    'language.selector': 'भाषा',
    'language.english': 'English',
    'language.hindi': 'हिन्दी',
    'language.bengali': 'বাংলা',
    'language.telugu': 'తెలుగు',
    'language.marathi': 'मराठी',
    'language.tamil': 'தமிழ்',
    'language.gujarati': 'ગુજરાતી',
    'language.kannada': 'ಕನ್ನಡ',
    'language.malayalam': 'മലയാളം',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.assamese': 'অসমীয়া',
    'language.spanish': 'Español',
    'language.french': 'Français',
    'language.german': 'Deutsch',
  },
  
  mr: {
    // Navigation
    'nav.legalEase': 'LegalEase AI',
    'nav.upload': 'कायदेशीर दस्तावेजांचे विश्लेषण करा',
    'nav.summary': 'सारांश',
    'nav.clauses': 'कलमे',
    'nav.chat': 'चॅट',
    
    // Upload
    'upload.title': 'सेकंदांमध्ये, तासांमध्ये नाही',
    'upload.description': 'कोणताही कायदेशीर दस्तावेज अपलोड करा आणि त्वरित सारांश तयार करा, मुख्य कलमे हायलाइट करा, किंवा वास्तविक वेळेच्या अंतर्दृष्टी आणि विश्लेषणासाठी आमच्या AI शी चॅट करा.',
    'upload.button': 'दस्तावेज निवडा',
    'upload.uploading': 'अपलोड होत आहे…',
    'upload.success': 'यशस्वीरित्या अपलोड केले',
    'upload.error': 'दस्तावेज अपलोड करण्यात अयशस्वी',
    'upload.remove': 'दस्तावेज काढा',
    'upload.removed': 'दस्तावेज काढले',
    'upload.unsupported': 'असमर्थित फाइल स्वरूप. समर्थित स्वरूप: {formats}',
    
    // Summary
    'summary.title': 'सारांश',
    'summary.description': 'स्पष्ट आणि समजण्यास सोपे सारांश',
    'summary.analysisIn': '{language} मध्ये विश्लेषण',
    'summary.generate': 'सारांश तयार करा',
    'summary.generating': 'तयार होत आहे…',
    'summary.noSummary': 'अद्याप कोणताही सारांश नाही.',
    'summary.copy': 'कॉपी करा',
    'summary.download': 'PDF डाउनलोड करा',
    'summary.copied': 'क्लिपबोर्डमध्ये कॉपी केले',
    
    // Clauses
    'clauses.title': 'कलमे',
    'clauses.description': 'मुख्य कलमे आणि त्यांचे परिणाम विश्लेषित करा',
    'clauses.analyze': 'कलमांचे विश्लेषण करा',
    'clauses.analyzing': 'विश्लेषण होत आहे…',
    'clauses.noClauses': 'अद्याप कोणतेही कलम विश्लेषण नाही.',
    'clauses.safe': 'सुरक्षित',
    'clauses.caution': 'सावधानता',
    'clauses.risky': 'धोकादायक',
    
    // Chat
    'chat.title': 'चॅट',
    'chat.description': 'आपल्या दस्तावेजाबद्दल प्रश्न विचारा',
    'chat.placeholder': 'आपल्या दस्तावेजाबद्दल एक प्रश्न विचारा...',
    'chat.send': 'पाठवा',
    'chat.sending': 'पाठवत आहे…',
    'chat.noMessages': 'अद्याप कोणतेही संदेश नाहीत.',
    
    // Common
    'common.uploadFirst': 'प्रथम एक दस्तावेज अपलोड करा',
    'common.error': 'एक त्रुटी आली',
    'common.loading': 'लोड होत आहे...',
    'common.close': 'बंद करा',
    'common.cancel': 'रद्द करा',
    'common.save': 'जतन करा',
    'common.delete': 'काढा',
    
    // Footer
    'footer.disclaimer': '⚠️ कायदेशीर सल्ला नाही. हे साधन शैक्षणिक हेतूंसाठी एक प्रोटोटाइप आहे.',
    
    // Language selector
    'language.selector': 'भाषा',
    'language.english': 'English',
    'language.hindi': 'हिन्दी',
    'language.marathi': 'मराठी',
  }
}

const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
]

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en')
  const [isRTL, setIsRTL] = useState(false)

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('legalease_language') || 'en'
    setLanguage(savedLanguage)
    
    // Set RTL for Arabic/Hebrew
    setIsRTL(['ar', 'he'].includes(savedLanguage))
  }, [])

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage)
    setIsRTL(['ar', 'he'].includes(newLanguage))
    localStorage.setItem('legalease_language', newLanguage)
  }

  const t = (key, params = {}) => {
    let translation = translations[language]?.[key] || translations['en'][key] || key
    
    // Replace parameters in translation
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param])
    })
    
    return translation
  }

  // Get appropriate CSS class for the language
  const getLanguageClass = () => {
    const languageClasses = {
      'hi': 'hindi-text',
      'mr': 'marathi-text'
    }
    return languageClasses[language] || ''
  }

  const value = {
    language,
    setLanguage: changeLanguage,
    t,
    isRTL,
    supportedLanguages
  }

  return (
    <LanguageContext.Provider value={value}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className={getLanguageClass()}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}
