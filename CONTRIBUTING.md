# Contributing to WeatherGPT

Thank you for your interest in contributing to WeatherGPT! This document provides guidelines for contributing to the project.

---

## 🚀 Getting Started

1. **Fork the repository**
   - Click the "Fork" button on GitHub
   - Clone your fork locally

2. **Set up development environment**
   - Follow [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for setup instructions
   - Ensure all tests pass before making changes

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 📝 Development Guidelines

### Code Style

**Python (Backend):**
- Follow PEP 8 style guide
- Use type hints for function parameters and return values
- Add docstrings for classes and functions
- Maximum line length: 100 characters

**TypeScript/React (Frontend):**
- Follow Airbnb React/TypeScript style guide
- Use functional components with hooks
- Add JSDoc comments for complex functions
- Use proper TypeScript types (avoid `any`)

### Commit Messages

Use conventional commit format:

```
type(scope): brief description

Detailed explanation if necessary

Examples:
feat(api): add weather alert endpoint
fix(ui): resolve mobile responsive layout issue
docs(readme): update installation instructions
refactor(llm): optimize prompt engineering
test(weather): add unit tests for forecast service
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

---

## 🧪 Testing

### Run Tests

**Backend:**
```bash
# Unit tests
python -m pytest tests/

# System check
python system_check.py
```

**Frontend:**
```bash
cd frontend/web
npm test
npm run lint
```

### Writing Tests

- Add tests for new features
- Ensure existing tests pass
- Aim for >80% code coverage
- Test edge cases and error conditions

---

## 🔄 Pull Request Process

1. **Update documentation**
   - Update README.md if adding features
   - Update API.md for new endpoints
   - Add comments for complex logic

2. **Test your changes**
   ```bash
   # Backend
   python system_check.py
   
   # Frontend
   cd frontend/web && npm test
   ```

3. **Create pull request**
   - Use a descriptive title
   - Reference related issues
   - Describe what changed and why
   - Include screenshots for UI changes

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Manual testing completed
   - [ ] All tests passing
   
   ## Screenshots (if applicable)
   Add screenshots here
   
   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

---

## 🐛 Reporting Bugs

Use GitHub Issues with the following information:

**Bug Report Template:**
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Ubuntu 22.04]
- Browser: [e.g., Chrome 120]
- Docker version: [e.g., 24.0.0]
- API versions: [Groq/Gemini]

## Screenshots
Add screenshots if applicable

## Additional Context
Any other relevant information
```

---

## 💡 Feature Requests

Use GitHub Issues with the "feature request" label:

```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Mockups, examples, references
```

---

## 🏗️ Project Structure

```
weather-gpt/
├── backend/              # Python FastAPI backend
│   ├── api/             # API routes
│   ├── services/        # Business logic
│   ├── models/          # Database models
│   └── tests/           # Backend tests
├── frontend/web/        # Next.js frontend
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   └── lib/           # Utility functions
├── docs/               # Documentation
└── tests/             # Integration tests
```

---

## 🎯 Areas for Contribution

### High Priority
- [ ] Additional Indian language support
- [ ] Mobile app (React Native)
- [ ] Improved weather visualizations
- [ ] Performance optimizations
- [ ] Enhanced test coverage

### Medium Priority
- [ ] User authentication system
- [ ] Saved location preferences
- [ ] Weather data caching improvements
- [ ] Accessibility enhancements
- [ ] Additional LLM provider support

### Low Priority
- [ ] Weather widget embeds
- [ ] Browser extensions
- [ ] Social media sharing
- [ ] Weather data export

---

## 📚 Resources

- **Documentation:** [README.md](README.md)
- **API Reference:** [docs/API.md](docs/API.md)
- **Setup Guide:** [SETUP.md](SETUP.md)
- **Development:** [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🤝 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive environment for all contributors.

### Standards
- Use welcoming and inclusive language
- Respect differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Enforcement
Violations may result in temporary or permanent ban from the project.

---

## 💬 Questions?

- Open a GitHub Discussion
- Check existing issues and PRs
- Review documentation first

---

**Thank you for contributing to WeatherGPT!** 🌦️
