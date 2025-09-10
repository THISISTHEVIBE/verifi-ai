import React from 'react'
import { Shield, LogIn, Github, Mail } from 'lucide-react'
import { getSignInUrl } from '../services/authService'

const SignInPrompt: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 w-12 h-12 rounded-lg bg-primary-600 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Please sign in</h1>
        <p className="mt-2 text-gray-600">You need to sign in to upload documents and view analytics.</p>
        <div className="mt-6 space-y-3">
          <a href={getSignInUrl('github')} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 text-white px-4 py-2 hover:bg-black">
            <Github className="w-4 h-4" /> Sign in with GitHub
          </a>
          <a href={getSignInUrl('google')} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white text-gray-900 px-4 py-2 border border-gray-300 hover:bg-gray-50">
            <LogIn className="w-4 h-4" /> Sign in with Google
          </a>
          <a href={getSignInUrl()} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white text-gray-900 px-4 py-2 border border-gray-300 hover:bg-gray-50">
            <Mail className="w-4 h-4" /> Other methods
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-500">You will be redirected back here after signing in.</p>
      </div>
    </div>
  )
}

export default SignInPrompt
