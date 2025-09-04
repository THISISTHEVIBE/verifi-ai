# OpenAI Integration Setup

This document explains how to set up the OpenAI API integration for real document analysis in the VerifiAI demo.

## Prerequisites

1. An OpenAI account with API access
2. A valid OpenAI API key with Vision API access

## Setup Instructions

### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it starts with `sk-`)

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file and replace the placeholder with your actual API key:
   ```
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 3. Restart Development Server

After setting up the environment variables, restart your development server:

```bash
npm run dev
```

## How It Works

The integration uses OpenAI's GPT-4 Vision API to analyze uploaded documents. Here's what happens:

1. **Document Upload**: User uploads a document (PDF, JPG, PNG)
2. **Image Processing**: The document is converted to base64 format
3. **AI Analysis**: OpenAI's Vision API analyzes the document for:
   - Authenticity indicators
   - Text consistency
   - Security features
   - Potential signs of tampering
   - Document-specific validation rules
4. **Results**: Returns confidence score, verification status, and detailed analysis

## Document Types Supported

- **Identity Documents**: Passports, ID cards, driver's licenses
- **Financial Documents**: Bank statements, utility bills, invoices
- **Business Documents**: Contracts, registrations, certificates
- **Academic Documents**: Diplomas, transcripts, certificates

## Security Considerations

⚠️ **Important**: This demo implementation uses the OpenAI API directly from the frontend for demonstration purposes. In a production environment, you should:

1. **Use a Backend Service**: API calls should be made from your backend server
2. **Secure API Keys**: Never expose API keys in frontend code
3. **Rate Limiting**: Implement proper rate limiting and usage controls
4. **Data Privacy**: Ensure compliance with data protection regulations

## Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Make sure you've created a `.env` file with your API key
   - Restart the development server after adding the key

2. **"Failed to analyze document" error**
   - Check if your API key has Vision API access
   - Verify you have sufficient credits in your OpenAI account
   - Ensure the uploaded file is a supported format (PDF, JPG, PNG)

3. **High API costs**
   - The Vision API can be expensive for high-resolution images
   - Consider implementing image compression before sending to the API
   - Monitor your usage in the OpenAI dashboard

### API Limits

- OpenAI has rate limits and usage quotas
- Check your account limits in the OpenAI dashboard
- Consider implementing caching for repeated analyses

## Cost Estimation

The Vision API pricing (as of 2024):
- Input: $0.01 per 1K tokens for high-detail images
- Output: $0.03 per 1K tokens

A typical document analysis might cost $0.01-0.05 per document depending on image size and complexity.

## Next Steps

For production deployment:

1. Create a backend API service
2. Implement proper authentication and authorization
3. Add database storage for analysis results
4. Implement user management and billing
5. Add more sophisticated document validation rules
6. Consider using specialized document verification services for higher accuracy
