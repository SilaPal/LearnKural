# Contributing to Thirukural Learning Web App

Thank you for your interest in contributing to this educational project! This guide will help you get started.

## Code of Conduct

This project is dedicated to preserving and sharing Tamil cultural heritage. We welcome contributions that:
- Respect the cultural significance of Thirukkural
- Improve the educational experience for children
- Maintain code quality and accessibility standards
- Foster an inclusive learning environment

## Getting Started

### Prerequisites
- Node.js 18+
- Basic knowledge of React, TypeScript, and Express.js
- Understanding of Tamil language (helpful but not required)

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Create environment file: `cp .env.example .env`
5. Start development server: `npm run dev`

## Types of Contributions

### 🐛 Bug Reports
- Use GitHub issues with the "bug" label
- Include steps to reproduce
- Provide browser/device information
- Screenshots for UI issues

### ✨ Feature Requests
- Use GitHub issues with the "enhancement" label
- Describe the educational benefit
- Consider accessibility implications
- Discuss implementation approach

### 📝 Documentation
- README improvements
- Code comments
- API documentation
- Educational content explanations

### 🎨 UI/UX Improvements
- Mobile responsiveness
- Accessibility enhancements
- Tamil font rendering
- Child-friendly interface design

### 🔧 Technical Improvements
- Performance optimizations
- Code refactoring
- Test coverage
- Security enhancements

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow existing naming conventions
- Write descriptive comments for complex logic
- Maintain consistent indentation (2 spaces)

### Component Structure
```typescript
// Good component structure
interface ComponentProps {
  // Clear prop types
}

export default function Component({ prop }: ComponentProps) {
  // Hooks at the top
  // Event handlers
  // Render logic
}
```

### API Design
- Use RESTful endpoints
- Implement proper error handling
- Validate input data with Zod schemas
- Return consistent response formats

### Tamil Language Support
- Use proper Tamil Unicode encoding
- Test with various Tamil fonts
- Ensure right-to-left text support where needed
- Validate Tamil text input/output

## Testing Guidelines

### Manual Testing
- Test on multiple devices (mobile, tablet, desktop)
- Verify Tamil text rendering
- Test speech recognition with Tamil pronunciation
- Check audio playback functionality

### Automated Testing (Future)
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows

## Pull Request Process

### Before Submitting
1. Create a feature branch: `git checkout -b feature/description`
2. Make focused, atomic commits
3. Test your changes thoroughly
4. Update documentation if needed

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tested on mobile devices
- [ ] Verified Tamil text rendering
- [ ] Checked speech recognition
- [ ] Validated audio playback

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

### Review Process
1. Maintainers will review within 48 hours
2. Address feedback promptly
3. Keep discussions respectful and constructive
4. Be open to suggestions and improvements

## Educational Considerations

### Content Guidelines
- Maintain accuracy of Thirukkural translations
- Respect the cultural and spiritual significance
- Use age-appropriate language for children
- Ensure educational value of new features

### Accessibility
- Support screen readers
- Provide keyboard navigation
- Use sufficient color contrast
- Include alternative text for images

### Performance
- Optimize for slow internet connections
- Minimize bundle size
- Implement proper loading states
- Cache frequently accessed content

## Technical Architecture

### Frontend (React)
- Component-based architecture
- Custom hooks for reusable logic
- Responsive design with Tailwind CSS
- Type-safe development with TypeScript

### Backend (Express.js)
- RESTful API design
- In-memory storage for simplicity
- Session-based authentication
- Google Sheets integration

### External Integrations
- Speech Recognition API
- YouTube embeds
- Google Sheets for content management
- External audio file hosting

## Getting Help

### Resources
- Check existing GitHub issues
- Review the README.md
- Examine the codebase structure
- Look at recent pull requests

### Communication
- Create GitHub issues for questions
- Be specific about your problem
- Include relevant code snippets
- Provide context about your goals

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project documentation
- Release notes for significant contributions

## Cultural Sensitivity

When working on this project, please:
- Treat Thirukkural content with respect
- Maintain accuracy in translations
- Consider the educational impact on children
- Preserve the spiritual and cultural significance

Thank you for contributing to the preservation and sharing of Tamil cultural heritage through technology!