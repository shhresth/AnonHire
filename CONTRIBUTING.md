# Contributing to AnonHire

We love your input! We want to make contributing to AnonHire as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

### Branch Naming

- `feature/your-feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/what-you-documented` - Documentation
- `refactor/what-you-refactored` - Code refactoring

### Commit Messages

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Example:**
```
feat(zkp): add salary range proof circuit

Implement new circuit for proving salary falls within a range
without revealing exact amount.

Closes #123
```

## Code Style

### TypeScript/JavaScript

- Use TypeScript strict mode
- 2 spaces for indentation
- Use meaningful variable names
- Add JSDoc comments for functions
- Run `npm run lint` before committing

### Solidity

- Follow Solidity style guide
- Use NatSpec comments
- Run `npm run lint` in contracts directory
- Gas optimization is important

### Tests

- Write tests for all new features
- Maintain >80% code coverage
- Test edge cases
- Use descriptive test names

## Testing

```bash
# Run all tests
npm test

# Test specific module
cd contracts && npm test
cd backend && npm test
cd frontend && npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Documentation

- Update README.md if adding user-facing features
- Add inline code comments for complex logic
- Update API documentation for endpoint changes
- Add examples for new features

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Open an issue or reach out to the maintainers.

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

**Positive behavior:**
- Being respectful
- Accepting constructive criticism
- Focusing on what's best for the community

**Unacceptable behavior:**
- Harassment
- Trolling
- Personal attacks

### Enforcement

Instances of abusive behavior may be reported to the project team. All complaints will be reviewed and investigated.


