# Multilingual Support Testing Guide

## Overview

Weather-GPT supports 10 Indian languages with full pipeline preservation from input to output. This document covers automated tests, manual verification, and known limitations.

## Supported Languages

| Code | Language | Script | Native Name |
|------|----------|--------|-------------|
| en | English | Latin | English |
| hi | Hindi | Devanagari | हिन्दी |
| ta | Tamil | Tamil | தமிழ் |
| te | Telugu | Telugu | తెలుగు |
| bn | Bengali | Bengali | বাংলা |
| mr | Marathi | Devanagari | मराठी |
| kn | Kannada | Kannada | ಕನ್ನಡ |
| gu | Gujarati | Gujarati | ગુજરાતી |
| ml | Malayalam | Malayalam | മലയാളം |
| pa | Punjabi | Gurmukhi | ਪੰਜਾਬੀ |

## Automated Test Suite

Location: `/home/piyushxdev/SIH/weather-gpt/backend/tests/test_multilingual.py`

### Running Tests

```bash
# Run all multilingual tests
pytest backend/tests/test_multilingual.py -v

# Run with coverage
pytest backend/tests/test_multilingual.py --cov=backend/services/chat_service --cov-report=html

# Run specific test categories
pytest backend/tests/test_multilingual.py -k "test_language_preservation"
pytest backend/tests/test_multilingual.py -k "test_edge_cases"
pytest backend/tests/test_multilingual.py -k "test_encoding"
```

### Test Coverage

1. **Language Preservation Tests**
   - Input language detection
   - Intent extraction preserves language
   - Response generation maintains language
   - Full pipeline E2E per language

2. **Weather Terminology Tests**
   - Rain/precipitation terms
   - Temperature terms
   - Wind terms
   - Weather condition descriptions

3. **Role-Specific Terminology**
   - Citizen (simple language)
   - Farmer (agricultural terms)
   - Pilot (aviation terms)
   - Disaster Manager (emergency terms)

4. **Edge Cases**
   - Code-switching (English + Hindi mix)
   - Transliteration (Hindi in Roman script)
   - Regional dialects
   - Empty/malformed input

5. **Encoding & Typography**
   - UTF-8 handling
   - Script rendering
   - JSON serialization
   - API round-trip preservation

## Manual Testing Checklist

### Frontend Language Selector

- [ ] All 10 languages appear in dropdown
- [ ] Native script renders correctly for each language
- [ ] Language selection persists across queries
- [ ] Flag emojis display correctly

### Text Input & Display

- [ ] Input field accepts all Indic scripts
- [ ] Copy-paste from native keyboard works
- [ ] Response displays in correct script
- [ ] No mojibake or encoding issues
- [ ] Typography is readable (font size, line height)

### Real Query Testing

Test each language with at least 2 real queries:

**Hindi (हिन्दी)**
```
1. दिल्ली में कल बारिश होगी क्या?
2. मुंबई का मौसम कैसा है?
```

**Tamil (தமிழ்)**
```
1. சென்னையில் இன்று மழை பெய்யுமா?
2. வெப்பநிலை எவ்வளவு?
```

**Telugu (తెలుగు)**
```
1. హైదరాబాద్‌లో వాతావరణం ఎలా ఉంది?
2. రేపు వాన పడుతుందా?
```

**Bengali (বাংলা)**
```
1. কলকাতায় আজ আবহাওয়া কেমন?
2. আগামীকাল বৃষ্টি হবে?
```

**Marathi (मराठी)**
```
1. पुण्यात आज पाऊस पडेल का?
2. मुंबईचे हवामान कसे आहे?
```

**Kannada (ಕನ್ನಡ)**
```
1. ಬೆಂಗಳೂರಿನಲ್ಲಿ ಇಂದು ಮಳೆ ಬರುತ್ತದೆಯೇ?
2. ತಾಪಮಾನ ಎಷ್ಟು ಇದೆ?
```

### Edge Cases to Test Manually

1. **Code-switching**
   ```
   Mumbai में कल rain होगा क्या?
   Will it rain कल in दिल्ली?
   ```

2. **Transliteration**
   ```
   Dilli mein mausam kaisa hai?
   Mumbai ka temperature kya hai?
   ```

3. **Long queries**
   ```
   मुझे मुंबई, दिल्ली, और चेन्नई के अगले तीन दिनों का पूरा मौसम का विवरण चाहिए क्योंकि मैं यात्रा की योजना बना रहा हूं
   ```

4. **Special characters**
   ```
   दिल्ली में तापमान 30°C है क्या?
   Chennai-ல மழை 50% probability உள்ளதா?
   ```

## API Testing

### cURL Examples

**Hindi Query**
```bash
curl -X POST http://localhost:8000/api/v1/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "दिल्ली में आज मौसम कैसा है?",
    "language": "hi",
    "role": "citizen"
  }'
```

**Tamil Query**
```bash
curl -X POST http://localhost:8000/api/v1/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "சென்னையில் இன்று மழை பெய்யுமா?",
    "language": "ta",
    "role": "citizen"
  }'
```

**Code-switching Query**
```bash
curl -X POST http://localhost:8000/api/v1/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Mumbai में कल rain होगा क्या?",
    "language": "hi",
    "role": "citizen"
  }'
```

### Expected Response Structure

```json
{
  "query": "दिल्ली में आज मौसम कैसा है?",
  "response": "दिल्ली में आज का मौसम... (Hindi response)",
  "language": "hi",
  "role": "citizen",
  "intent": {
    "place": "Delhi",
    "language": "hi",
    "intent": "current",
    "nationwide": false
  },
  "llm_tier_used": "primary"
}
```

## Known Limitations

1. **LLM Quality Variance**
   - Primary LLM (Groq) quality is best for English and Hindi
   - Other languages depend on LLM training data
   - Responses may occasionally mix English technical terms

2. **Font Rendering**
   - Requires system fonts for Indic scripts
   - Some older browsers may have rendering issues
   - Mobile devices should have native script support

3. **Voice Input**
   - Speech-to-text not yet implemented
   - Will require language-specific STT models

4. **Transliteration**
   - Roman script input (e.g., "Dilli") is best-effort
   - May not always be detected correctly
   - Recommend native script for best results

## Accessibility Considerations

1. **Screen Readers**
   - Verify lang attribute is set correctly
   - Test with NVDA (Hindi support)
   - Test with mobile screen readers

2. **Keyboard Navigation**
   - Language selector accessible via keyboard
   - Input methods (IME) work correctly
   - Tab order is logical

3. **Font Size**
   - Indic scripts may need larger base font size
   - Verify readability at 200% zoom
   - Test with browser text-only zoom

## Browser Compatibility

### Tested Browsers

- [ ] Chrome/Edge (best support)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile browsers (Android/iOS)

### Font Requirements

Most modern browsers have Indic script support, but verify:

- **Devanagari** (Hindi, Marathi): Noto Sans Devanagari, Arial Unicode MS
- **Tamil**: Noto Sans Tamil, Lohit Tamil
- **Telugu**: Noto Sans Telugu, Lohit Telugu
- **Bengali**: Noto Sans Bengali, Lohit Bengali
- **Kannada**: Noto Sans Kannada, Lohit Kannada
- **Gujarati**: Noto Sans Gujarati, Lohit Gujarati
- **Malayalam**: Noto Sans Malayalam, Lohit Malayalam
- **Punjabi**: Noto Sans Gurmukhi, Lohit Punjabi

## Performance Considerations

1. **LLM Token Usage**
   - Indic scripts may use more tokens than Latin
   - Monitor token costs per language
   - Consider caching common responses

2. **Response Time**
   - Language detection adds minimal overhead
   - LLM generation time is language-independent
   - Network latency is the main factor

## Testing Before Release

### Pre-deployment Checklist

1. **Automated Tests**
   - [ ] All pytest tests passing
   - [ ] Coverage > 80% for chat_service.py
   - [ ] No encoding errors in logs

2. **Manual Testing**
   - [ ] Tested at least 2 queries per language
   - [ ] Edge cases verified (code-switching, transliteration)
   - [ ] UI displays all scripts correctly

3. **API Testing**
   - [ ] All languages via cURL/Postman
   - [ ] JSON serialization handles Unicode
   - [ ] Response times acceptable (<3s)

4. **Browser Testing**
   - [ ] Chrome, Firefox, Safari tested
   - [ ] Mobile browsers tested
   - [ ] No rendering issues

5. **Documentation**
   - [ ] README updated with language examples
   - [ ] API docs show multilingual examples
   - [ ] Limitations documented

## Reporting Issues

When reporting a multilingual bug, include:

1. **Language Code**: Which language (e.g., "hi" for Hindi)
2. **Input Query**: Exact text entered
3. **Expected Output**: What language/content you expected
4. **Actual Output**: What you received
5. **Environment**: Browser, OS, API endpoint
6. **Screenshots**: Especially for rendering issues

## Future Enhancements

1. **Additional Languages**
   - Sanskrit, Urdu, Nepali
   - Regional dialects
   - English (Indian accent/vocabulary)

2. **Quality Improvements**
   - Fine-tune LLM for Indic languages
   - Better transliteration support
   - Context-aware code-switching

3. **Voice Support**
   - STT for all languages
   - TTS for responses
   - Voice language auto-detection

4. **Localization**
   - Date/time formats per locale
   - Number formatting
   - Measurement units (°C vs °F)
