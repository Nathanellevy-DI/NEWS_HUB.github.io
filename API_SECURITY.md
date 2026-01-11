# NewsHub - API Configuration

## API Key Security

### Current Setup (Development)
The NewsAPI key is currently hardcoded in `js/apis/news.js` for development purposes.

**⚠️ SECURITY WARNING**: This approach exposes your API key in client-side code, which means:
- Anyone can view your API key in the browser's developer tools
- Your key could be used by others, consuming your API quota
- This is acceptable for development but NOT for production

### Recommended Production Setup

#### Option 1: Environment Variables (Recommended for Static Sites)
If deploying to platforms like Netlify, Vercel, or GitHub Pages with build process:

1. Create a `.env` file (add to `.gitignore`):
```
VITE_NEWS_API_KEY=your_api_key_here
```

2. Use a build tool like Vite to inject the variable:
```javascript
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
```

3. Deploy with environment variable set on the platform

#### Option 2: Backend Proxy (Most Secure)
Create a simple backend server to proxy API requests:

1. Set up a Node.js/Python backend
2. Store API key in backend environment variables
3. Frontend calls your backend endpoint
4. Backend makes request to NewsAPI with key
5. Backend returns data to frontend

Example backend endpoint (Node.js):
```javascript
app.get('/api/news', async (req, res) => {
  const response = await fetch(`https://newsapi.org/v2/top-headlines?apiKey=${process.env.NEWS_API_KEY}`);
  const data = await response.json();
  res.json(data);
});
```

#### Option 3: Serverless Functions
Use serverless functions (Netlify Functions, Vercel Functions):

```javascript
// netlify/functions/news.js
exports.handler = async (event) => {
  const response = await fetch(`https://newsapi.org/v2/top-headlines?apiKey=${process.env.NEWS_API_KEY}`);
  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};
```

### Current API Key
```
79377d568bcf41a09bd598b6fa41fcfb
```

**Action Required**: 
- For production deployment, implement one of the recommended solutions above
- Consider regenerating your API key if it has been exposed publicly
- Monitor your NewsAPI usage dashboard for unexpected activity

### Rate Limits
- NewsAPI Free Tier: 100 requests/day
- Consider caching responses in localStorage to reduce API calls
- Implement request throttling for search functionality

## Additional Security Considerations

1. **CORS Proxy**: Currently using `api.allorigins.win` - consider self-hosting for production
2. **Input Validation**: Sanitize user inputs for search and custom categories
3. **XSS Protection**: Ensure all user-generated content is properly escaped
4. **Content Security Policy**: Add CSP headers to prevent XSS attacks
