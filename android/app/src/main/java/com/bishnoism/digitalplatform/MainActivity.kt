package com.bishnoism.digitalplatform

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.SafeBrowsingResponse
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout

/**
 * Minimal Android WebView host for the existing Bishnoi Digital Platform website.
 *
 * This repository currently contains the website/PWA, not a complete Android
 * Gradle project. Add this file to an Android app module and add the INTERNET
 * permission to that module's AndroidManifest.xml to build and run it.
 */
class MainActivity : Activity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = Color.rgb(20, 54, 34) // #143622
        window.navigationBarColor = Color.rgb(20, 54, 34)

        webView = WebView(this).apply {
            setBackgroundColor(Color.rgb(250, 246, 238)) // #FAF6EE
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            settings.apply {
                javaScriptEnabled = true // The website's navigation and features use JavaScript.
                domStorageEnabled = true // Needed for the site's PWA/Firebase web experience.
                allowFileAccess = false
                allowContentAccess = false
                javaScriptCanOpenWindowsAutomatically = false
                setSupportMultipleWindows(false)
                mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
            }

            webViewClient = BishnoismWebViewClient()
            webChromeClient = WebChromeClient()
        }

        setContentView(webView)
        webView.loadUrl(HOME_URL)
    }

    @Deprecated("Deprecated in Android 13; retained for compatibility with a plain Activity")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            (webView.parent as? ViewGroup)?.removeView(webView)
            webView.stopLoading()
            webView.destroy()
        }
        super.onDestroy()
    }

    private inner class BishnoismWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(
            view: WebView,
            request: WebResourceRequest
        ): Boolean {
            val uri = request.url
            val scheme = uri.scheme?.lowercase()

            // Keep the site itself in the app. Send other web destinations and
            // phone/email links to an installed external app/browser.
            if (scheme == "https" && uri.host.equals(SITE_HOST, ignoreCase = true)) {
                return false
            }

            if (scheme == "https" || scheme == "http" || scheme == "mailto" || scheme == "tel") {
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, uri))
                    true
                } catch (_: Exception) {
                    true // Do not crash if no application can handle the link.
                }
            }

            // Block unknown schemes such as javascript:, file:, and intent:.
            return true
        }
    }

    companion object {
        private const val SITE_HOST = "bishnoism.vercel.app"
        private const val HOME_URL = "https://bishnoism.vercel.app/"
    }
}
