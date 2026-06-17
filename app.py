import os
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template

app = Flask(__name__)

def parse_feed():
    feed_url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    feed = feedparser.parse(feed_url)
    
    if feed.bozo:
        # Feed parsing encountered an error or was warning-level non-well-formed
        # We can still proceed if feed.entries exists, but let's check
        if not feed.entries:
            raise Exception("Failed to parse BigQuery release notes Atom feed.")

    all_updates = []
    
    for entry in feed.entries:
        date_str = entry.title
        updated_str = getattr(entry, 'updated', '')
        link_str = getattr(entry, 'link', '')
        entry_id = getattr(entry, 'id', '')
        
        content_val = entry.content[0].value if hasattr(entry, 'content') else getattr(entry, 'summary', '')
        if not content_val:
            continue
            
        soup = BeautifulSoup(content_val, 'html.parser')
        
        current_type = "Update"
        current_content = []
        
        def add_update(update_type, content_nodes):
            if not content_nodes:
                return
            html_content = ''.join(str(c) for c in content_nodes).strip()
            clean_soup = BeautifulSoup(html_content, 'html.parser')
            text_content = clean_soup.get_text().strip()
            
            # Format Twitter text (Truncate to fit tweet limit if necessary, but provide a clean link)
            base_tweet = f"Google BigQuery [{update_type}] ({date_str}): {text_content}"
            # Twitter character limit is 280. We allocate characters for formatting, hashtags and link.
            # Hashtags: #BigQuery #GoogleCloud (approx 24 chars)
            # URL: 23 chars (Twitter's short link conversion t.co)
            # We want to truncate the main body so the whole tweet is safely within limit
            max_body_len = 280 - 24 - 23 - 8 # Safe buffer
            if len(base_tweet) > max_body_len:
                base_tweet = base_tweet[:max_body_len] + "..."
            
            tweet_text = f"{base_tweet}\n\n#BigQuery #GoogleCloud\n{link_str}"
            
            # Generate a stable unique ID
            safe_type = update_type.lower().replace(" ", "-")
            update_id = f"{entry_id}_{safe_type}_{len(all_updates)}"
            
            all_updates.append({
                'id': update_id,
                'date': date_str,
                'updated': updated_str,
                'link': link_str,
                'type': update_type,
                'html': html_content,
                'text': text_content,
                'tweet_text': tweet_text
            })
            
        for child in soup.children:
            if child.name == 'h3':
                if current_content:
                    add_update(current_type, current_content)
                    current_content = []
                current_type = child.get_text().strip()
            elif child.name is not None:
                current_content.append(child)
                
        if current_content:
            add_update(current_type, current_content)
            
    return all_updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def releases():
    try:
        updates = parse_feed()
        return jsonify({
            'success': True,
            'updates': updates,
            'count': len(updates)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Default Flask port is 5000
    app.run(debug=True, host='0.0.0.0', port=5001)
