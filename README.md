# Insider Trading Dashboard

A professional dashboard for tracking and analyzing insider trading patterns. Built with Next.js 14, TypeScript, and Supabase.

![Dashboard Preview](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-Database-green)

## Features

- **LLM Analysis** - AI-generated trading recommendations based on insider activity
- **P&L Tracking** - Performance calculations for all tracked positions
- **Smart Filtering** - View all positions, top winners, or top losers
- **Insider Intelligence** - Track multiple insiders per position with transaction details
- **Modern UI** - Clean, responsive design with dark/light mode support
- **Interactive Tables** - Detailed modal views for each position
- **Performance Metrics** - Aggregate statistics including average P&L and total value

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account ([sign up free](https://supabase.com))


### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

```

3. **Set up the database**

Run this SQL in your Supabase SQL Editor:

```sql
-- Create llm_calls table
CREATE TABLE llm_calls (
  id SERIAL PRIMARY KEY,
  call_date TIMESTAMP WITH TIME ZONE NOT NULL,
  batch_id TEXT,
  ticker TEXT NOT NULL,
  company_name TEXT,
  recommendation TEXT NOT NULL,
  rank INTEGER,
  signal_strength INTEGER,
  time_horizon TEXT,
  number_of_insiders INTEGER,
  total_transaction_value NUMERIC,
  transaction_dates JSONB,
  insider_names JSONB,
  entry_price NUMERIC,
  entry_date DATE NOT NULL,
  entry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  price_change_pct NUMERIC,
  holding_days INTEGER,
  pnl_dollars NUMERIC,
  llm_rationale TEXT,
  market_patterns JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  insider_avg_price NUMERIC,
  insider_prices_json JSONB,
  current_price NUMERIC,
  last_price_update TIMESTAMP WITH TIME ZONE,
  traded BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX idx_llm_calls_ticker ON llm_calls(ticker);
CREATE INDEX idx_llm_calls_entry_date ON llm_calls(entry_date DESC);
CREATE INDEX idx_llm_calls_recommendation ON llm_calls(recommendation);

-- Enable Row Level Security (optional - adjust based on your needs)
ALTER TABLE llm_calls ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access (adjust for your security requirements)
CREATE POLICY "Allow public read access" ON llm_calls
  FOR SELECT USING (true);
```

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Dashboard Features

- **Filters**:
  - **All** - Show all positions
  - **Top Winners** - Top 20 best performing positions
  - **Top Losers** - Top 20 worst performing positions
- **Stats Bar** - View aggregate metrics:
  - Total positions tracked
  - Average P&L percentage
  - Total transaction value
  - Strong Buy count
- **Interactive Table** - Click any row to see detailed analysis
- **Detail Modal** - View complete information including:
  - LLM rationale
  - Transaction details
  - Insider names and prices
  - Market patterns
  - Metadata
- **Theme Toggle** - Switch between light and dark modes

## Project Structure

```
insider-dashboard/
├── app/
│   ├── globals.css            # Global styles & theme
│   ├── layout.tsx             # Root layout with theme provider
│   └── page.tsx               # Dashboard page
├── components/
│   └── Sidebar.tsx            # Navigation sidebar (legacy)
├── contexts/
│   └── ThemeContext.tsx       # Theme management (dark/light)
├── lib/
│   └── supabase/
│       └── client.ts          # Supabase client configuration
├── types/
│   └── insider.ts             # TypeScript type definitions
└── env.template               # Environment variables template
```

## Theming

The dashboard supports both light and dark modes:

- Toggle via the button in the header
- Theme preference saved to localStorage
- CSS custom properties for easy customization
- Purple accent color scheme

### Customizing Theme

Edit `app/globals.css` to modify colors:

```css
:root {
  --purple-primary: #8B5CF6;  /* Main purple accent */
  --bg-primary: #FFFFFF;       /* Main background */
  --text-primary: #1F2937;     /* Main text color */
  /* ... more variables ... */
}
```

## Security Considerations

### Row Level Security (RLS)

The provided SQL includes RLS setup. Adjust policies based on your needs:

- **Public dashboard**: Keep the current policy
- **Private dashboard**: Add authentication and user-specific policies
- **Admin-only writes**: Create separate policies for INSERT/UPDATE/DELETE

### Environment Variables

Never commit `.env.local` to version control. Use:
- Vercel Environment Variables for production
- Railway Secrets for Railway deployments
- Your platform's secure environment variable system

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

```bash
npm run build  # Test production build locally
```

## Database Schema

The `llm_calls` table stores all insider trading analysis:

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key |
| `ticker` | TEXT | Stock ticker symbol |
| `company_name` | TEXT | Company name |
| `recommendation` | TEXT | STRONG BUY, BUY, WATCH |
| `signal_strength` | INTEGER | 1-10 signal strength |
| `entry_price` | NUMERIC | Our entry price |
| `current_price` | NUMERIC | Current stock price |
| `price_change_pct` | NUMERIC | P&L percentage |
| `holding_days` | INTEGER | Days held |
| `llm_rationale` | TEXT | AI-generated analysis |
| `insider_names` | JSONB | Array of insider names |
| `transaction_dates` | JSONB | Array of transaction dates |
| `market_patterns` | JSONB | Identified market patterns |
| ... | ... | See SQL above for full schema |



