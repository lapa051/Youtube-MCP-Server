const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_API_KEY_HERE';

// Search YouTube videos endpoint
app.get('/api/search', async (req, res) => {
  const { q, maxResults = 5 } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing search query!' });
  }
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY_HERE') {
    return res.status(500).json({ error: 'YouTube API key not set!' });
  }

  try {
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search`;
    const params = {
      key: YOUTUBE_API_KEY,
      q,
      part: 'snippet',
      maxResults,
      type: 'video'
    };

    const { data } = await axios.get(youtubeUrl, { params });

    // Handle YouTube API errors
    if (data.error) {
      const { code, message, errors } = data.error;
      return res.status(code || 500).json({ error: message, details: errors });
    }

    // Extract video results
    const results = (data.items || []).map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.default.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    res.json({ results });
  } catch (err) {
    // Axios network or API error
    if (err.response) {
      // YouTube API returned an error response
      const { status, statusText, data } = err.response;
      let errorMsg = data?.error?.message || statusText;
      return res.status(status).json({ error: `YouTube API error: ${errorMsg}` });
    } else if (err.request) {
      // No response received
      return res.status(502).json({ error: 'No response from YouTube API. Please try again later.' });
    } else {
      // Other errors
      return res.status(500).json({ error: `Server error: ${err.message}` });
    }
  }
});

// Catch-all 404 for unspecified endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
