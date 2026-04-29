// ===== YOUTUBE TO MP3 CONVERTER - RAPIDAPI VERSION =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('YouTube to MP3 Converter loaded with RapidAPI');
    
    // 🔑 YOUR RAPIDAPI KEY (from your curl command)
    const RAPIDAPI_KEY = '4b36c31694msh1cdcec0b31dc05bp11f6f8jsn9c48a958e28f';
    const RAPIDAPI_HOST = 'youtube-mp36.p.rapidapi.com';
    
    // DOM elements
    const videoUrlInput = document.getElementById('videoUrl');
    const convertBtn = document.getElementById('convertBtn');
    const errorMessage = document.getElementById('errorMessage');
    const loading = document.getElementById('loading');
    const resultCard = document.getElementById('resultCard');
    const videoTitle = document.getElementById('videoTitle');
    const videoDuration = document.getElementById('videoDuration');
    const videoChannel = document.getElementById('videoChannel');
    const videoThumbnail = document.getElementById('videoThumbnail');
    const fileSize = document.getElementById('fileSize');
    const downloadBtn = document.getElementById('downloadBtn');
    const qualityRadios = document.querySelectorAll('input[name="quality"]');
    
    // Store video data
    let currentVideoData = null;
    
    // Extract video ID from various YouTube URL formats
    function extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/,
            /youtube\.com\/embed\/([^/?]+)/,
            /youtube\.com\/v\/([^/?]+)/,
            /youtube\.com\/shorts\/([^/?]+)/
        ];
        
        for (let pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }
    
    // Validate YouTube URL
    function isValidYouTubeUrl(url) {
        return extractVideoId(url) !== null;
    }
    
    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        loading.style.display = 'none';
        resultCard.style.display = 'none';
        
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
    
    // Format duration (convert seconds to mm:ss)
    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Convert YouTube to MP3 using RapidAPI
    async function convertToMP3(videoId) {
        const url = `https://${RAPIDAPI_HOST}/dl?id=${videoId}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-rapidapi-host': RAPIDAPI_HOST,
                    'x-rapidapi-key': RAPIDAPI_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API Response:', data);
            return data;
            
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Process conversion
    async function processConversion() {
        const url = videoUrlInput.value.trim();
        
        if (!url) {
            showError('Please enter a YouTube URL');
            return;
        }
        
        if (!isValidYouTubeUrl(url)) {
            showError('Invalid YouTube URL. Please check the format.');
            return;
        }
        
        const videoId = extractVideoId(url);
        
        // Show loading
        loading.style.display = 'block';
        resultCard.style.display = 'none';
        errorMessage.style.display = 'none';
        
        try {
            // Call RapidAPI
            const data = await convertToMP3(videoId);
            
            if (data.status === 'ok') {
                // Store video data
                currentVideoData = data;
                
                // Update UI with video info
                videoTitle.textContent = data.title || 'YouTube Video';
                videoChannel.textContent = data.author || 'YouTube';
                videoThumbnail.src = data.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                
                if (data.duration) {
                    videoDuration.textContent = `Duration: ${formatDuration(parseInt(data.duration))}`;
                } else {
                    videoDuration.textContent = 'Duration: --:--';
                }
                
                // Get selected quality
                let selectedQuality = '128';
                qualityRadios.forEach(radio => {
                    if (radio.checked) selectedQuality = radio.value;
                });
                
                // Estimate file size (rough estimate)
                const durationSec = parseInt(data.duration) || 180;
                const sizeMB = ((parseInt(selectedQuality) * durationSec) / (8 * 1024)).toFixed(1);
                fileSize.textContent = `Estimated size: ~${sizeMB} MB (${selectedQuality}kbps)`;
                
                // Hide loading, show result
                loading.style.display = 'none';
                resultCard.style.display = 'block';
                
                // Track usage
                trackToolUsage();
                
            } else {
                loading.style.display = 'none';
                showError('Conversion failed. Please try again.');
            }
            
        } catch (error) {
            console.error('Conversion error:', error);
            loading.style.display = 'none';
            showError('Failed to process video. Please check your API key or try again.');
        }
    }
    
    // Handle download
    downloadBtn.addEventListener('click', function() {
        if (!currentVideoData) {
            showError('No video converted yet.');
            return;
        }
        
        // Get selected quality
        let selectedQuality = '128';
        qualityRadios.forEach(radio => {
            if (radio.checked) selectedQuality = radio.value;
        });
        
        // The API provides a download link
        if (currentVideoData.link) {
            // Open download link in new tab
            window.open(currentVideoData.link, '_blank');
            
            // Track usage
            trackToolUsage();
        } else {
            // Fallback - open YouTube video
            if (confirm('Direct download link not available. Open YouTube video instead?')) {
                window.open(`https://www.youtube.com/watch?v=${currentVideoData.id}`, '_blank');
            }
        }
    });
    
    // Update file size estimate when quality changes
    qualityRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (resultCard.style.display === 'block' && currentVideoData && currentVideoData.duration) {
                const durationSec = parseInt(currentVideoData.duration) || 180;
                const sizeMB = ((parseInt(this.value) * durationSec) / (8 * 1024)).toFixed(1);
                fileSize.textContent = `Estimated size: ~${sizeMB} MB (${this.value}kbps)`;
            }
        });
    });
    
    // Track tool usage (for guest limits)
    function trackToolUsage() {
        if (typeof firebase !== 'undefined') {
            const user = firebase.auth().currentUser;
            if (!user) {
                let guestUses = localStorage.getItem('toolsnova_guest_uses') ? 
                    parseInt(localStorage.getItem('toolsnova_guest_uses')) : 0;
                
                guestUses++;
                localStorage.setItem('toolsnova_guest_uses', guestUses);
                
                // Update display if needed
                const usesLeft = document.getElementById('usesLeft');
                if (usesLeft) {
                    usesLeft.textContent = Math.max(0, 3 - guestUses);
                }
            }
        }
    }
    
    // Event listeners
    convertBtn.addEventListener('click', processConversion);
    
    videoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processConversion();
        }
    });
});

// Firebase auth state observer
if (typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged(function(user) {
        const authLinks = document.getElementById('authLinks');
        const userMenu = document.getElementById('userMenu');
        const userGreeting = document.getElementById('userGreeting');
        const footerLogin = document.getElementById('footerLogin');
        const footerSignup = document.getElementById('footerSignup');
        const footerLogout = document.getElementById('footerLogout');
        const footerGuestInfo = document.getElementById('footerGuestInfo');
        const footerUserInfo = document.getElementById('footerUserInfo');
        
        if (user) {
            if (authLinks) authLinks.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                if (userGreeting) userGreeting.textContent = `Hi, ${user.email.split('@')[0]}`;
            }
            if (footerLogin) footerLogin.style.display = 'none';
            if (footerSignup) footerSignup.style.display = 'none';
            if (footerLogout) footerLogout.style.display = 'block';
            if (footerGuestInfo) footerGuestInfo.style.display = 'none';
            if (footerUserInfo) footerUserInfo.style.display = 'flex';
        } else {
            if (authLinks) authLinks.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
            if (footerLogin) footerLogin.style.display = 'block';
            if (footerSignup) footerSignup.style.display = 'block';
            if (footerLogout) footerLogout.style.display = 'none';
            if (footerGuestInfo) footerGuestInfo.style.display = 'flex';
            if (footerUserInfo) footerUserInfo.style.display = 'none';
        }
    });
}