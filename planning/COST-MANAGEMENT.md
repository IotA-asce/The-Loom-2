# LLM Cost Management Specification

> *"Transparency in cost builds trust. Control over spending empowers users."*

This document defines the comprehensive cost management strategy for The Loom 2, ensuring users have full visibility and control over their LLM API spending.

---

## Table of Contents

1. [Cost Philosophy](#1-cost-philosophy)
2. [Provider Pricing Analysis](#2-provider-pricing-analysis)
3. [Token Usage Estimation](#3-token-usage-estimation)
4. [Cost Tracking Implementation](#4-cost-tracking-implementation)
5. [User-Facing Cost Features](#5-user-facing-cost-features)
6. [Optimization Strategies](#6-optimization-strategies)
7. [Implementation Plan](#7-implementation-plan)
8. [Free Tier Strategy](#8-free-tier-strategy)
9. [Cost Scenarios](#9-cost-scenarios)
10. [Privacy & Transparency](#10-privacy--transparency)
11. [Alerts & Notifications](#11-alerts--notifications)
12. [Provider-Specific Features](#12-provider-specific-features)

---

## 1. Cost Philosophy

### 1.1 User-Pays Model

The Loom 2 operates on a **pure client-side, user-pays architecture**:

| Aspect | Implementation |
|--------|----------------|
| **API Keys** | Users provide their own Gemini/OpenAI keys |
| **Billing** | No centralized billing infrastructure |
| **Visibility** | Real-time cost tracking and estimates |
| **Education** | Built-in cost education and optimization tips |

### 1.2 Why This Model

```
┌─────────────────────────────────────────────────────────────┐
│                    USER-PAYS ADVANTAGES                     │
├─────────────────────────────────────────────────────────────┤
│  🔒 PRIVACY        │  No server intermediary, data stays    │
│                    │  on user's device                      │
├─────────────────────────────────────────────────────────────┤
│  📈 SCALABILITY    │  No central infrastructure costs       │
│                    │  or rate limit bottlenecks             │
├─────────────────────────────────────────────────────────────┤
│  🎛️  USER CONTROL   │  Users control their own spending      │
│                    │  limits and provider preferences       │
├─────────────────────────────────────────────────────────────┤
│  ⚖️  LEGAL SIMPLE   │  No payment processing, refunds, or    │
│                    │  financial liability for the project   │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Core Principles

1. **Zero Surprises**: Users always see costs before operations
2. **Full Transparency**: Every token is accounted for and explainable
3. **User Sovereignty**: Users own their cost data, stored locally
4. **Educational**: Help users understand and optimize their spending

---

## 2. Provider Pricing Analysis

### 2.1 Google Gemini 2.0 Flash Experimental

| Tier | Input Cost | Output Cost | Limits |
|------|-----------|-------------|--------|
| **Free** | $0 | $0 | 1,500 requests/day |
| **Pay-as-you-go** | $0.075/1M tokens | $0.30/1M tokens | Rate limits apply |
| **Context Caching** | $0.025/1M tokens/hour | N/A | For repeated contexts |

**Pricing Details:**
- 1 million input tokens ≈ 750,000 words ≈ 1,500 pages of text
- Images: ~258 tokens per image (varies by resolution)
- Context window: 1 million tokens (input)

### 2.2 OpenAI GPT-4o

| Tier | Input Cost | Output Cost | Notes |
|------|-----------|-------------|-------|
| **Standard** | $2.50/1M tokens | $10.00/1M tokens | Higher quality, more expensive |
| **Cached** | $1.25/1M tokens | $10.00/1M tokens | 50% discount on cached input |

**Pricing Comparison:**
```
Cost per 1K tokens (input + output avg):
┌─────────────────────────────────────────────────┐
│ Gemini 2.0 Flash    ████░░░░░░░░░░  $0.00019   │
│ GPT-4o              ████████████████████  $0.00625  │
└─────────────────────────────────────────────────┘
GPT-4o is ~33x more expensive than Gemini Flash
```

### 2.3 Cost Comparison Examples

#### Example A: 200-Page Manga Analysis

| Operation | Gemini Cost | GPT-4o Cost | Difference |
|-----------|-------------|-------------|------------|
| Input (200 images) | ~$0.004 | ~$0.13 | 32.5x |
| Input (prompt text) | ~$0.0001 | ~$0.003 | 30x |
| Output (analysis) | ~$0.001 | ~$0.03 | 30x |
| **Total** | **~$0.005** | **~$0.16** | **32x** |

#### Example B: Single Branch Generation

| Operation | Gemini Cost | GPT-4o Cost | Notes |
|-----------|-------------|-------------|-------|
| Context input | ~$0.001 | ~$0.025 | Story context |
| Output (branch) | ~$0.001 | ~$0.04 | Generated content |
| **Total** | **~$0.002** | **~$0.065** | 32.5x |

#### Example C: Story Continuation (1 Chapter)

| Operation | Gemini Cost | GPT-4o Cost | Notes |
|-----------|-------------|-------------|-------|
| Context input | ~$0.003 | ~$0.10 | Growing context |
| Output (chapter) | ~$0.002 | ~$0.07 | 4K-8K tokens |
| **Total** | **~$0.005** | **~$0.17** | 34x |

**Annual Projection (Enthusiast User):**
- Gemini: ~$60-180/year
- GPT-4o: ~$2,000-6,000/year

---

## 3. Token Usage Estimation

### 3.1 Component-by-Component Breakdown

#### Analysis Phase (Component 3: Storyline Analyzer)

```
┌─────────────────────────────────────────────────────────────┐
│                    ANALYSIS PHASE COSTS                     │
├─────────────────────────────────────────────────────────────┤
│  Input Components                                           │
│  ├── Image (per page):           200-300 tokens            │
│  ├── Analysis prompt:            500-800 tokens            │
│  └── Optional context:           0-500 tokens              │
│                                                             │
│  Output Components                                          │
│  ├── Plot summary:               500-1500 tokens           │
│  ├── Character profiles:         500-2000 tokens           │
│  └── Themes & motifs:            300-1000 tokens           │
├─────────────────────────────────────────────────────────────┤
│  Per Page Estimate:            ~500-1500 tokens            │
│  200-Page Manga:               ~100K-300K tokens           │
│  Estimated Cost (Gemini):      ~$0.08-0.25                 │
│  Estimated Cost (GPT-4o):      ~$2.50-7.50                 │
└─────────────────────────────────────────────────────────────┘
```

#### Anchor Detection (Component 4: Anchor Event Detector)

| Metric | Value |
|--------|-------|
| Context input | 5,000-10,000 tokens (full analysis) |
| Detection prompt | 200-400 tokens |
| Expected response | 2,000-3,000 tokens (anchor list) |
| **Total per analysis** | ~10,000 tokens |
| **Cost (Gemini)** | ~$0.01 |
| **Cost (GPT-4o)** | ~$0.30 |

#### Branch Generation (Component 5: Branch Generator)

| Metric | Value |
|--------|-------|
| Story context | 6,000-12,000 tokens |
| Anchor point data | 500-1,000 tokens |
| Generation prompt | 1,000-2,000 tokens |
| Expected response | 3,000-5,000 tokens |
| **Total per generation** | ~15,000 tokens |
| **Cost (Gemini)** | ~$0.02-0.05 |
| **Cost (GPT-4o)** | ~$0.50-0.90 |

#### Story Continuation (Component 6: Story Continuation)

| Metric | Value |
|--------|-------|
| Story context (grows) | 10,000-50,000 tokens |
| Continuation prompt | 500-1,000 tokens |
| Expected response | 4,000-8,000 tokens |
| **Total per chapter** | ~15,000-60,000 tokens |
| **Cost (Gemini)** | ~$0.02-0.15 |
| **Cost (GPT-4o)** | ~$0.50-2.00 |

**Context Growth Warning:**
```
Chapter 1:  ~15K tokens  ($0.02)
Chapter 5:  ~25K tokens  ($0.04)
Chapter 10: ~40K tokens  ($0.07)
Chapter 20: ~60K tokens  ($0.11)
```

### 3.2 Token Counting Methodology

**Text Tokenization:**
```typescript
// Approximation: 1 token ≈ 0.75 words (English)
// More accurate for code: use tiktoken or provider SDKs

function estimateTextTokens(text: string): number {
  // Simple approximation
  return Math.ceil(text.length / 4);
}

// Provider-specific counting
async function countTokensGemini(text: string): Promise<number> {
  // Use Google's countTokens API
  const result = await model.countTokens(text);
  return result.totalTokens;
}

async function countTokensOpenAI(text: string): Promise<number> {
  // Use tiktoken
  const encoding = get_encoding("cl100k_base");
  return encoding.encode(text).length;
}
```

**Image Tokenization:**
```typescript
// Gemini image tokens
interface ImageTokenEstimate {
  width: number;
  height: number;
  tokens: number;
}

// ~258 tokens for standard manga page (1200x1800)
// Scales with dimensions
function estimateImageTokens(width: number, height: number): number {
  const baseTokens = 258;
  const area = width * height;
  const baseArea = 1200 * 1800;
  return Math.ceil(baseTokens * (area / baseArea));
}
```

---

## 4. Cost Tracking Implementation

### 4.1 Data Model

```typescript
// src/types/cost-tracking.ts

/**
 * Individual token usage record
 */
interface TokenUsage {
  id: string;                          // UUID
  operation: OperationType;
  provider: Provider;
  model: string;
  
  // Token counts
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  
  // Cost calculation
  inputCost: number;                   // USD
  outputCost: number;                  // USD
  totalCost: number;                   // USD
  
  // Context
  timestamp: Date;
  mangaId?: string;
  branchId?: string;
  sessionId: string;
  
  // Status
  success: boolean;
  errorMessage?: string;
  retryCount: number;
  
  // Metadata
  imageCount?: number;
  cachedInputTokens?: number;          // For context caching
}

type OperationType = 
  | 'analysis'           // Full manga analysis
  | 'anchor_detection'   // Anchor point identification
  | 'branch_generation'  // Alternative timeline creation
  | 'continuation'       // Story chapter generation
  | 'summary';           // Summary/regeneration

type Provider = 'gemini' | 'openai';

/**
 * Aggregated usage statistics
 */
interface UsageSummary {
  period: 'day' | 'week' | 'month' | 'all';
  startDate: Date;
  endDate: Date;
  
  // Totals
  totalCost: number;
  totalTokens: number;
  totalOperations: number;
  
  // Breakdown
  byOperation: Record<OperationType, {
    count: number;
    cost: number;
    tokens: number;
  }>;
  
  byProvider: Record<Provider, {
    count: number;
    cost: number;
    tokens: number;
  }>;
  
  // Rates
  averageCostPerOperation: number;
  successRate: number;
}

/**
 * User budget settings
 */
interface BudgetSettings {
  dailyLimit: number;                  // USD, 0 = unlimited
  monthlyLimit: number;                // USD, 0 = unlimited
  
  // Alerts
  alertThresholds: number[];           // [0.5, 0.8, 1.0] = 50%, 80%, 100%
  
  // Confirmations
  confirmAboveCost: number;            // Confirm operations above $X
  
  // Provider preference
  preferredProvider: Provider;
  allowFallback: boolean;
}
```

### 4.2 Tracking Points

```typescript
// src/services/CostTracker.ts

class CostTracker {
  private db: IDBDatabase;
  private currentSession: string;
  
  /**
   * Track pre-operation estimate
   */
  async estimateOperation(
    operation: OperationType,
    provider: Provider,
    inputEstimate: TokenEstimate
  ): Promise<CostEstimate> {
    const estimate = await this.calculateCost(
      provider,
      inputEstimate,
      this.getExpectedOutput(operation)
    );
    
    // Check budget
    const budgetStatus = await this.checkBudget(estimate.totalCost);
    
    return {
      ...estimate,
      wouldExceedBudget: !budgetStatus.allowed,
      remainingBudget: budgetStatus.remaining
    };
  }
  
  /**
   * Track post-operation actual usage
   */
  async recordUsage(
    request: TokenUsageRequest,
    response: LLMResponse
  ): Promise<TokenUsage> {
    const usage: TokenUsage = {
      id: crypto.randomUUID(),
      operation: request.operation,
      provider: request.provider,
      model: response.model,
      inputTokens: response.usage.prompt_tokens,
      outputTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      inputCost: this.calculateInputCost(
        request.provider, 
        response.usage.prompt_tokens
      ),
      outputCost: this.calculateOutputCost(
        request.provider,
        response.usage.completion_tokens
      ),
      totalCost: 0, // Calculated below
      timestamp: new Date(),
      mangaId: request.mangaId,
      branchId: request.branchId,
      sessionId: this.currentSession,
      success: true,
      retryCount: request.retryCount || 0
    };
    
    usage.totalCost = usage.inputCost + usage.outputCost;
    
    await this.saveUsage(usage);
    await this.checkAndTriggerAlerts(usage);
    
    return usage;
  }
  
  /**
   * Track failed operations
   */
  async recordFailure(
    request: TokenUsageRequest,
    error: Error
  ): Promise<TokenUsage> {
    const usage: TokenUsage = {
      id: crypto.randomUUID(),
      ...request,
      outputTokens: 0,
      totalTokens: request.inputTokens,
      inputCost: this.calculateInputCost(request.provider, request.inputTokens),
      outputCost: 0,
      totalCost: 0,
      timestamp: new Date(),
      sessionId: this.currentSession,
      success: false,
      errorMessage: error.message
    };
    
    usage.totalCost = usage.inputCost; // Still charged for input
    
    await this.saveUsage(usage);
    return usage;
  }
}
```

### 4.3 Storage Implementation

```typescript
// src/storage/CostStorage.ts

const DB_NAME = 'loom-cost-tracking';
const DB_VERSION = 1;

const SCHEMA = {
  usage: {
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'operation', keyPath: 'operation' },
      { name: 'provider', keyPath: 'provider' },
      { name: 'mangaId', keyPath: 'mangaId' },
      { name: 'sessionId', keyPath: 'sessionId' }
    ]
  },
  budgets: {
    keyPath: 'id',
    indexes: []
  }
};

class CostStorage {
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Usage store
        const usageStore = db.createObjectStore('usage', { keyPath: 'id' });
        SCHEMA.usage.indexes.forEach(idx => {
          usageStore.createIndex(idx.name, idx.keyPath);
        });
        
        // Budget settings store
        db.createObjectStore('budgets', { keyPath: 'id' });
      };
    });
  }
  
  async getUsageByDateRange(
    start: Date, 
    end: Date
  ): Promise<TokenUsage[]> {
    const transaction = this.db.transaction('usage', 'readonly');
    const store = transaction.objectStore('usage');
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.bound(start, end));
      const results: TokenUsage[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  async exportData(): Promise<string> {
    const allUsage = await this.getAllUsage();
    const budgets = await this.getBudgetSettings();
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      version: '1.0',
      usage: allUsage,
      budgets
    }, null, 2);
  }
  
  async clearAllData(): Promise<void> {
    const transaction = this.db.transaction(['usage', 'budgets'], 'readwrite');
    await Promise.all([
      transaction.objectStore('usage').clear(),
      transaction.objectStore('budgets').clear()
    ]);
  }
}
```

---

## 5. User-Facing Cost Features

### 5.1 Cost Estimation UI

```typescript
// src/components/CostEstimator.tsx

interface CostEstimatorProps {
  operation: OperationType;
  pageCount?: number;
  contextSize?: number;
}

const CostEstimator: React.FC<CostEstimatorProps> = ({
  operation,
  pageCount,
  contextSize
}) => {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const { preferredProvider } = useCostSettings();
  
  useEffect(() => {
    calculateEstimate(operation, {
      pageCount,
      contextSize,
      provider: preferredProvider
    }).then(setEstimate);
  }, [operation, pageCount, contextSize, preferredProvider]);
  
  if (!estimate) return <Skeleton height={60} />;
  
  return (
    <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Estimated Cost
            </Typography>
            <Typography variant="h5" component="div">
              ${estimate.totalCost.toFixed(4)}
            </Typography>
          </Box>
          
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">
              {estimate.totalTokens.toLocaleString()} tokens
            </Typography>
            <ProviderBadge provider={preferredProvider} />
          </Box>
        </Box>
        
        {estimate.wouldExceedBudget && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This operation would exceed your daily budget.
          </Alert>
        )}
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Based on {estimate.assumptions.join(', ')}
        </Typography>
      </CardContent>
    </Card>
  );
};
```

**Pre-Analysis Estimate Display:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Analysis Cost Estimate                                       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Manga: Attack on Titan (200 pages)                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Estimated Cost:              ~$0.20                    │   │
│  │  Token Count:                 ~150,000 tokens           │   │
│  │  Provider:                    Gemini 2.0 Flash          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Breakdown:                                                     │
│  • Image analysis (200 pages):  ~$0.08                        │
│  • Text processing:             ~$0.02                        │
│  • Output generation:           ~$0.10                        │
│                                                                 │
│  [✓] This will use ~3% of Gemini's daily free tier            │
│                                                                 │
│              [  Start Analysis  ]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Budget Controls

```typescript
// src/components/BudgetSettings.tsx

const BudgetSettings: React.FC = () => {
  const { settings, updateSettings } = useCostSettings();
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Budget Controls
      </Typography>
      
      <Stack spacing={3}>
        {/* Daily Limit */}
        <FormControl fullWidth>
          <FormLabel>Daily Spending Limit</FormLabel>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              type="number"
              value={settings.dailyLimit || ''}
              onChange={(e) => updateSettings({ 
                dailyLimit: parseFloat(e.target.value) || 0 
              })}
              placeholder="Unlimited"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.dailyLimit === 0}
                  onChange={(e) => updateSettings({ 
                    dailyLimit: e.target.checked ? 0 : 5 
                  })}
                />
              }
              label="Unlimited"
            />
          </Box>
        </FormControl>
        
        {/* Alert Thresholds */}
        <FormControl>
          <FormLabel>Alert Thresholds</FormLabel>
          <FormGroup row>
            {[50, 80, 100].map(threshold => (
              <FormControlLabel
                key={threshold}
                control={
                  <Checkbox
                    checked={settings.alertThresholds.includes(threshold / 100)}
                    onChange={() => toggleThreshold(threshold / 100)}
                  />
                }
                label={`${threshold}%`}
              />
            ))}
          </FormGroup>
          <FormHelperText>
            Receive notifications when spending reaches these thresholds
          </FormHelperText>
        </FormControl>
        
        {/* Confirmation Settings */}
        <FormControl fullWidth>
          <FormLabel>Confirm Operations Above</FormLabel>
          <TextField
            type="number"
            value={settings.confirmAboveCost}
            onChange={(e) => updateSettings({ 
              confirmAboveCost: parseFloat(e.target.value) || 0 
            })}
            helperText="Show confirmation dialog for expensive operations"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>
            }}
          />
        </FormControl>
      </Stack>
    </Paper>
  );
};
```

### 5.3 Cost Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  💰 LLM Usage Dashboard                                                      │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│  │  This Month          │  │  This Week           │  │  Today           │ │
│  │  ──────────────────  │  │  ──────────────────  │  │  ──────────────  │ │
│  │  $3.45               │  │  $0.89               │  │  $0.12           │ │
│  │  45,000 tokens       │  │  11,200 tokens       │  │  1,500 tokens    │ │
│  │  12 operations       │  │  3 operations        │  │  1 operation     │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Cost Breakdown by Operation                                        │   │
│  │                                                                     │   │
│  │  Analysis        ████████████████████████████████░░░░  $2.30 (67%) │   │
│  │  Branches        █████████████████░░░░░░░░░░░░░░░░░░░  $0.85 (25%) │   │
│  │  Continuation    ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  $0.30 (8%)  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Provider Usage                                                     │   │
│  │                                                                     │   │
│  │  Gemini 2.0 Flash    ████████████████████████████████████  98%     │   │
│  │  GPT-4o              █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  2%     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Recent Activity                                                    │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │  Today, 2:30 PM    Branch Generation    $0.05    Attack on Titan   │   │
│  │  Today, 1:15 PM    Analysis             $0.08    Chainsaw Man      │   │
│  │  Yesterday         Continuation         $0.03    Bleach Branch 3   │   │
│  │  Feb 12            Branches (3)         $0.15    Naruto Analysis   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│                                  [Export Data]  [Clear History]             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```typescript
// src/components/CostDashboard.tsx

const CostDashboard: React.FC = () => {
  const { summary, recentUsage } = useCostSummary('month');
  const theme = useTheme();
  
  const chartData = Object.entries(summary.byOperation).map(
    ([op, data]) => ({
      name: formatOperationName(op),
      value: data.cost,
      percentage: (data.cost / summary.totalCost) * 100
    })
  );
  
  const COLORS = [theme.palette.primary.main, 
                  theme.palette.secondary.main, 
                  theme.palette.success.main];
  
  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} md={4}>
        <MetricCard
          title="This Month"
          value={`$${summary.totalCost.toFixed(2)}`}
          subtitle={`${summary.totalTokens.toLocaleString()} tokens`}
          icon={<WalletIcon />}
        />
      </Grid>
      
      {/* Cost Breakdown Chart */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, height: 300 }}>
          <Typography variant="h6" gutterBottom>
            Cost Breakdown
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, percentage }) => 
                  `${name}: ${percentage.toFixed(0)}%`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      {/* Recent Activity */}
      <Grid item xs={12}>
        <RecentActivityTable usage={recentUsage} />
      </Grid>
    </Grid>
  );
};
```

---

## 6. Optimization Strategies

### 6.1 Token Optimization

```typescript
// src/utils/tokenOptimization.ts

/**
 * Image optimization for vision models
 */
interface ImageOptimizationOptions {
  maxDimension?: number;      // Max width/height
  quality?: number;           // JPEG quality 0-1
  grayscale?: boolean;        // Convert to grayscale
}

async function optimizeImageForLLM(
  imageFile: File,
  options: ImageOptimizationOptions = {}
): Promise<Blob> {
  const {
    maxDimension = 1200,
    quality = 0.85,
    grayscale = false
  } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }
      
      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Apply grayscale if requested
      if (grayscale) {
        ctx.filter = 'grayscale(100%)';
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas export failed')),
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Smart batching for multiple pages
 */
function calculateOptimalBatchSize(
  pageCount: number,
  tokensPerPage: number,
  maxContextTokens: number = 1000000
): number {
  const overheadTokens = 1000; // Prompt overhead
  const availableTokens = maxContextTokens - overheadTokens;
  const tokensPerBatch = availableTokens / tokensPerPage;
  
  // Balance between API calls and context utilization
  return Math.min(Math.floor(tokensPerBatch), 50);
}

/**
 * Progressive context summarization
 */
async function compressContext(
  context: StoryContext,
  targetTokens: number
): Promise<StoryContext> {
  const currentTokens = estimateContextTokens(context);
  
  if (currentTokens <= targetTokens) {
    return context;
  }
  
  // Strategy: Summarize older chapters progressively
  const chapters = [...context.chapters];
  const compressionRatio = targetTokens / currentTokens;
  const chaptersToSummarize = Math.floor(
    chapters.length * (1 - compressionRatio)
  );
  
  for (let i = 0; i < chaptersToSummarize; i++) {
    chapters[i] = await summarizeChapter(chapters[i]);
  }
  
  return { ...context, chapters };
}
```

### 6.2 Caching Strategy

```typescript
// src/services/CacheManager.ts

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;              // Time-to-live in milliseconds
  costSavings: number;      // Estimated cost saved by this cache hit
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private db: IDBDatabase;
  
  /**
   * Cache key generation for deterministic lookups
   */
  generateCacheKey(
    operation: OperationType,
    params: Record<string, unknown>
  ): string {
    // Sort keys for consistency
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, unknown>);
    
    return `${operation}:${JSON.stringify(sortedParams)}`;
  }
  
  /**
   * Get from cache with automatic TTL check
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory first
    const memoryEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }
    
    // Check persistent storage
    const dbEntry = await this.getFromDB<T>(key);
    if (dbEntry && !this.isExpired(dbEntry)) {
      // Promote to memory
      this.memoryCache.set(key, dbEntry);
      return dbEntry.data;
    }
    
    return null;
  }
  
  /**
   * Store in cache with cost tracking
   */
  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      estimatedCost: number;
    }
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl: options.ttl || 24 * 60 * 60 * 1000, // 24 hours default
      costSavings: 0
    };
    
    // Store in memory (LRU eviction)
    if (this.memoryCache.size >= 100) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, entry);
    
    // Store in IndexedDB
    await this.saveToDB(entry);
  }
  
  /**
   * Track cache hit cost savings
   */
  async recordCacheHit(key: string, savedCost: number): Promise<void> {
    const entry = await this.getFromDB<unknown>(key);
    if (entry) {
      entry.costSavings += savedCost;
      await this.saveToDB(entry);
    }
  }
  
  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const allEntries = await this.getAllEntries();
    
    return {
      totalEntries: allEntries.length,
      memoryEntries: this.memoryCache.size,
      totalCostSavings: allEntries.reduce((sum, e) => sum + e.costSavings, 0),
      hitRate: await this.calculateHitRate()
    };
  }
  
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }
}
```

### 6.3 Provider Selection Logic

```typescript
// src/services/ProviderSelector.ts

interface ProviderSelectionCriteria {
  operation: OperationType;
  estimatedTokens: number;
  requiresMultimodal: boolean;
  requiresHighQuality: boolean;
  urgency: 'low' | 'normal' | 'high';
}

class ProviderSelector {
  private costTracker: CostTracker;
  private userSettings: BudgetSettings;
  
  async selectProvider(
    criteria: ProviderSelectionCriteria
  ): Promise<Provider> {
    // Check if user has explicit preference
    if (this.userSettings.preferredProvider) {
      if (await this.isProviderAvailable(this.userSettings.preferredProvider)) {
        return this.userSettings.preferredProvider;
      }
    }
    
    // Cost-based decision
    const geminiCost = await this.estimateCost('gemini', criteria);
    const openAICost = await this.estimateCost('openai', criteria);
    
    // Quality vs Cost trade-off
    if (criteria.requiresHighQuality) {
      // Use GPT-4o for critical operations
      if (openAICost < this.userSettings.confirmAboveCost) {
        return 'openai';
      }
    }
    
    // Check Gemini free tier status
    const geminiStatus = await this.getGeminiFreeTierStatus();
    if (geminiStatus.requestsRemaining > 0) {
      return 'gemini';
    }
    
    // Default to cheaper option
    return geminiCost < openAICost ? 'gemini' : 'openai';
  }
  
  async shouldUseContextCaching(
    operation: OperationType,
    contextSize: number
  ): Promise<boolean> {
    // Context caching beneficial for:
    // - Large contexts (>10K tokens)
    // - Repeated operations on same context
    // - Sequential operations (chapter generation)
    
    if (contextSize < 10000) return false;
    
    const recentUsage = await this.costTracker.getRecentUsage(
      operation,
      24 * 60 * 60 * 1000 // 24 hours
    );
    
    // Worth caching if we'll use context multiple times
    return recentUsage.length >= 3;
  }
}
```

---

## 7. Implementation Plan

### 7.1 Phase 1: Basic Tracking (Sprints 1-2)

| Task | Effort | Acceptance Criteria |
|------|--------|---------------------|
| Token usage data model | 1 day | TypeScript interfaces defined |
| IndexedDB storage layer | 2 days | CRUD operations working |
| LLM interceptor/hook | 2 days | All calls tracked automatically |
| Basic cost calculation | 1 day | Accurate per-provider pricing |
| **MVP Deliverable** | **6 days** | Cost tracking operational |

### 7.2 Phase 2: User Features (Sprints 3-4)

| Task | Effort | Acceptance Criteria |
|------|--------|---------------------|
| Cost estimation component | 2 days | Pre-operation estimates display |
| Budget settings UI | 2 days | Limits configurable |
| Dashboard implementation | 3 days | Charts and breakdowns |
| Alert notification system | 2 days | Threshold alerts working |
| **Phase 2 Deliverable** | **9 days** | Full user-facing cost features |

### 7.3 Phase 3: Optimization (Sprints 5-6)

| Task | Effort | Acceptance Criteria |
|------|--------|---------------------|
| Caching implementation | 3 days | Cache hits reduce API calls |
| Image optimization | 2 days | Reduced vision token usage |
| Context compression | 3 days | Long contexts handled efficiently |
| Provider auto-selection | 2 days | Optimal provider chosen |
| Advanced analytics | 2 days | Usage patterns identified |
| **Phase 3 Deliverable** | **12 days** | Optimized cost management |

### 7.4 Total Effort Estimate

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION TIMELINE                  │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: Basic Tracking      ████████░░░░░░░░░░  6 days   │
│  Phase 2: User Features       ████████████░░░░░░  9 days   │
│  Phase 3: Optimization        ████████████████░░ 12 days   │
│                                                             │
│  TOTAL: 27 days (~5.5 weeks with buffer)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Free Tier Strategy

### 8.1 Gemini Free Tier Limits

```
┌─────────────────────────────────────────────────────────────────┐
│              GEMINI 2.0 FLASH FREE TIER                         │
├─────────────────────────────────────────────────────────────────┤
│  Daily Limit: 1,500 requests                                    │
│  Rate Limit: 15 requests per minute                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  WHAT YOU CAN DO WITH FREE TIER                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  • 5-10 full manga analyses per day                    │   │
│  │  • 50+ branch generations per day                      │   │
│  │  • 100+ continuation requests per day                  │   │
│  │  • Mix of all operations comfortably                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Free Tier Monitoring

```typescript
// src/services/FreeTierMonitor.ts

interface FreeTierStatus {
  requestsToday: number;
  requestsRemaining: number;
  resetTime: Date;
  percentUsed: number;
  estimatedAnalysesRemaining: number;
  estimatedBranchesRemaining: number;
}

class FreeTierMonitor {
  private readonly DAILY_LIMIT = 1500;
  private readonly RATE_LIMIT_RPM = 15;
  
  async getStatus(): Promise<FreeTierStatus> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usage = await this.costTracker.getUsageByDateRange(
      today,
      new Date()
    );
    
    const requestsToday = usage.filter(
      u => u.provider === 'gemini'
    ).length;
    
    const percentUsed = (requestsToday / this.DAILY_LIMIT) * 100;
    
    return {
      requestsToday,
      requestsRemaining: Math.max(0, this.DAILY_LIMIT - requestsToday),
      resetTime: this.getResetTime(),
      percentUsed,
      estimatedAnalysesRemaining: Math.floor(
        (this.DAILY_LIMIT - requestsToday) / 30
      ),
      estimatedBranchesRemaining: Math.floor(
        (this.DAILY_LIMIT - requestsToday) / 3
      )
    };
  }
  
  async checkAndWarn(): Promise<void> {
    const status = await this.getStatus();
    
    if (status.percentUsed >= 100) {
      await this.showLimitReachedNotification(status);
    } else if (status.percentUsed >= 80) {
      await this.showWarningNotification(status);
    } else if (status.percentUsed >= 50) {
      await this.showInfoNotification(status);
    }
  }
  
  private async showWarningNotification(status: FreeTierStatus): Promise<void> {
    showNotification({
      type: 'warning',
      title: 'Approaching Free Tier Limit',
      message: `
        You've used ${status.percentUsed.toFixed(0)}% of your daily 
        free tier (${status.requestsRemaining} requests remaining).
        
        Consider:
        • Waiting until tomorrow (${formatTime(status.resetTime)})
        • Upgrading to pay-as-you-go
        • Switching to OpenAI (more expensive but no request limits)
      `,
      actions: [
        { label: 'Learn More', action: () => openPricingInfo() },
        { label: 'Dismiss', action: () => {} }
      ]
    });
  }
}
```

### 8.3 Staying Within Free Tier Recommendations

| Usage Pattern | Daily Budget | Monthly Equivalent |
|--------------|--------------|-------------------|
| **Conservative** | 500 requests | 15,000 requests |
| **Normal** | 1,000 requests | 30,000 requests |
| **Aggressive** | 1,500 requests | 45,000 requests |

**Tips for Free Tier Users:**
1. Batch operations when possible
2. Cache analysis results
3. Avoid unnecessary regenerations
4. Use off-peak hours (no rate limit benefit, but smoother experience)
5. Monitor usage dashboard regularly

---

## 9. Cost Scenarios

### 9.1 User Personas

#### Casual User
```
┌─────────────────────────────────────────────────────────────────┐
│  👤 CASUAL USER                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Profile: Reads manga occasionally, curious about branching    │
│                                                                 │
│  Monthly Usage:                                                 │
│  • 2 manga analyzed (200 pages each)                           │
│  • 5 branches per manga                                        │
│  • 2 chapters per branch (average)                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Breakdown:                                             │   │
│  │  • Analysis:        2 × $0.20      = $0.40             │   │
│  │  • Branch Gen:     10 × $0.03      = $0.30             │   │
│  │  • Continuation:   20 × $0.05      = $1.00             │   │
│  │  ─────────────────────────────────────────              │   │
│  │  TOTAL:                           = $1.70              │   │
│  │                                                         │   │
│  │  💡 Fits entirely within Gemini free tier!              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Enthusiast
```
┌─────────────────────────────────────────────────────────────────┐
│  🎨 ENTHUSIAST                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Profile: Active creator, multiple projects, regular usage     │
│                                                                 │
│  Monthly Usage:                                                 │
│  • 10 manga analyzed                                           │
│  • 20 branches per manga                                       │
│  • 3 chapters per branch                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Breakdown:                                             │   │
│  │  • Analysis:        10 × $0.20     = $2.00             │   │
│  │  • Branch Gen:    200 × $0.03      = $6.00             │   │
│  │  • Continuation:  600 × $0.05      = $30.00            │   │
│  │  ─────────────────────────────────────────              │   │
│  │  TOTAL:                           = $38.00             │   │
│  │                                                         │   │
│  │  ⚠️  Requires pay-as-you-go after ~3rd manga           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Power User
```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 POWER USER                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Profile: Professional use, content creation, full stories     │
│                                                                 │
│  Monthly Usage:                                                 │
│  • 50 manga analyzed                                           │
│  • Unlimited branches (avg 50 per manga)                       │
│  • Full story completion (10+ chapters)                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Breakdown:                                             │   │
│  │  • Analysis:        50 × $0.20     = $10.00            │   │
│  │  • Branch Gen:  2,500 × $0.03      = $75.00            │   │
│  │  • Continuation: 25K × $0.08       = $2,000.00         │   │
│  │  ─────────────────────────────────────────              │   │
│  │  TOTAL:                          = $2,085.00           │   │
│  │                                                         │   │
│  │  📊 Requires paid tier + optimization essential        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Cost Comparison Table

| User Type | Monthly Operations | Gemini Cost | GPT-4o Cost | Savings |
|-----------|-------------------|-------------|-------------|---------|
| Casual | ~50 | $0 | $0 | N/A (free tier) |
| Casual (paid) | ~50 | $1.70 | $55 | 97% |
| Enthusiast | ~810 | $38 | $1,200 | 97% |
| Power User | ~27,550 | $2,085 | $65,000 | 97% |

---

## 10. Privacy & Transparency

### 10.1 Cost Data Storage Policy

```
┌─────────────────────────────────────────────────────────────────┐
│  🔒 PRIVACY COMMITMENTS                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STORAGE:                                                       │
│  ✓ Local IndexedDB only                                        │
│  ✓ No server-side storage                                       │
│  ✓ No cloud synchronization                                     │
│  ✓ User owns their data                                         │
│                                                                 │
│  DATA RETENTION:                                                │
│  • Default: 90 days of usage history                           │
│  • User configurable: 7 days to unlimited                      │
│  • Auto-purge of old records                                    │
│                                                                 │
│  USER CONTROLS:                                                 │
│  • Export data as JSON/CSV                                     │
│  • Clear all history anytime                                    │
│  • Selective deletion of records                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Transparency Features

```typescript
// src/components/CostTransparency.tsx

const CostTransparency: React.FC<{ usage: TokenUsage }> = ({ usage }) => {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>How was this calculated?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Typography variant="body2">
            <strong>Provider:</strong>{' '}
            <Link 
              href={getProviderPricingUrl(usage.provider)}
              target="_blank"
              rel="noopener"
            >
              {usage.provider} Pricing <OpenInNewIcon fontSize="small" />
            </Link>
          </Typography>
          
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Component</TableCell>
                <TableCell align="right">Tokens</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Input</TableCell>
                <TableCell align="right">
                  {usage.inputTokens.toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  ${getInputRate(usage.provider)}/1M
                </TableCell>
                <TableCell align="right">
                  ${usage.inputCost.toFixed(6)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Output</TableCell>
                <TableCell align="right">
                  {usage.outputTokens.toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  ${getOutputRate(usage.provider)}/1M
                </TableCell>
                <TableCell align="right">
                  ${usage.outputCost.toFixed(6)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3}><strong>Total</strong></TableCell>
                <TableCell align="right">
                  <strong>${usage.totalCost.toFixed(6)}</strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <Typography variant="caption" color="text.secondary">
            Calculated at {usage.timestamp.toLocaleString()}
            {usage.cachedInputTokens && (
              <>
                <br />
                {usage.cachedInputTokens.toLocaleString()} tokens were served from cache
                (saved ~${calculateCacheSavings(usage)})
              </>
            )}
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
```

### 10.3 No Hidden Fees Guarantee

| Fee Type | Status | Explanation |
|----------|--------|-------------|
| Platform fees | ❌ None | We don't charge anything |
| Processing fees | ❌ None | Direct API calls only |
| Subscription | ❌ None | Pay only for what you use |
| Data export | ❌ None | Free unlimited exports |
| Advanced features | ❌ None | All features free to use |

---

## 11. Alerts & Notifications

### 11.1 Budget Alert System

```typescript
// src/services/AlertService.ts

type AlertLevel = 'info' | 'warning' | 'critical';

interface BudgetAlert {
  id: string;
  level: AlertLevel;
  type: 'budget' | 'spike' | 'error' | 'limit';
  message: string;
  triggeredAt: Date;
  acknowledged: boolean;
  data?: Record<string, unknown>;
}

class AlertService {
  private alerts: BudgetAlert[] = [];
  
  async checkBudgetAlerts(): Promise<void> {
    const summary = await this.costTracker.getDailySummary();
    const settings = await this.getBudgetSettings();
    
    if (settings.dailyLimit === 0) return;
    
    const percentUsed = summary.totalCost / settings.dailyLimit;
    
    for (const threshold of settings.alertThresholds) {
      if (percentUsed >= threshold && !this.hasAlertForToday(threshold)) {
        await this.triggerAlert({
          level: threshold >= 1 ? 'critical' : threshold >= 0.8 ? 'warning' : 'info',
          type: 'budget',
          message: this.formatBudgetMessage(threshold, summary),
          data: { threshold, currentSpend: summary.totalCost, limit: settings.dailyLimit }
        });
      }
    }
  }
  
  async checkSpikeDetection(): Promise<void> {
    const today = await this.costTracker.getDailySummary();
    const yesterday = await this.costTracker.getSummaryForDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    // Alert on 3x spending spike
    if (yesterday.totalCost > 0 && 
        today.totalCost > yesterday.totalCost * 3) {
      await this.triggerAlert({
        level: 'warning',
        type: 'spike',
        message: `
          Unusual spending detected: $${today.totalCost.toFixed(2)} today 
          vs $${yesterday.totalCost.toFixed(2)} yesterday.
          
          Review your recent operations to ensure this is expected.
        `,
        data: { today: today.totalCost, yesterday: yesterday.totalCost }
      });
    }
  }
  
  private formatBudgetMessage(threshold: number, summary: DailySummary): string {
    const percent = Math.round(threshold * 100);
    
    if (threshold >= 1) {
      return `
        🚫 Daily budget exceeded!
        
        You've spent $${summary.totalCost.toFixed(2)} of your 
        $${summary.limit.toFixed(2)} daily limit.
        
        New operations are blocked until tomorrow or until you 
        increase your budget limit.
      `;
    }
    
    return `
      ${percent >= 80 ? '⚠️' : 'ℹ️'} Daily budget ${percent}% used
      
      You've spent $${summary.totalCost.toFixed(2)} of your 
      $${summary.limit.toFixed(2)} daily limit.
      
      ${percent >= 80 
        ? 'Consider reducing operations or increasing your limit.' 
        : 'You\'re on track with your daily budget.'}
    `;
  }
  
  async triggerAlert(alert: Omit<BudgetAlert, 'id' | 'triggeredAt' | 'acknowledged'>): Promise<void> {
    const fullAlert: BudgetAlert = {
      ...alert,
      id: crypto.randomUUID(),
      triggeredAt: new Date(),
      acknowledged: false
    };
    
    this.alerts.push(fullAlert);
    
    // Show in UI
    showNotification({
      type: alert.level,
      title: this.getAlertTitle(alert),
      message: alert.message,
      persistent: alert.level === 'critical'
    });
    
    // Save for history
    await this.saveAlert(fullAlert);
  }
}
```

### 11.2 Alert UI Components

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Daily Budget Alert                                          │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  You've used 80% of your daily budget ($4.00 of $5.00)         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ████████████████████████████████████████░░░░░░░░░░░░░ │   │
│  │  80% used                                    20% left  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Options:                                                       │
│  • Continue with caution                                        │
│  • Increase daily limit                                         │
│  • Review today's usage                                         │
│                                                                 │
│              [Continue]  [Adjust Limit]  [View Details]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Provider-Specific Features

### 12.1 Gemini-Specific Optimizations

```typescript
// src/providers/GeminiProvider.ts

class GeminiProvider {
  private genAI: GoogleGenerativeAI;
  private cacheManager: CacheManager;
  
  /**
   * Use context caching for long conversations
   */
  async createCachedContext(
    analysisResult: MangaAnalysis,
    ttlMinutes: number = 60
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Create cache
    const cache = await this.genAI.caching.create({
      model: 'gemini-2.0-flash-exp',
      contents: this.formatAnalysisForCache(analysisResult),
      ttl: { minutes: ttlMinutes }
    });
    
    // Track cache cost ($0.025/1M tokens/hour)
    await this.costTracker.recordCacheCreation({
      tokens: analysisResult.estimatedTokens,
      duration: ttlMinutes,
      cost: (analysisResult.estimatedTokens / 1_000_000) * 0.025 * (ttlMinutes / 60)
    });
    
    return cache.name;
  }
  
  /**
   * Free tier monitoring
   */
  async checkFreeTierStatus(): Promise<FreeTierStatus> {
    // Note: Gemini doesn't provide API for quota checking
    // We track this client-side based on our own usage logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usage = await this.getUsageForDateRange(today, new Date());
    const requestsToday = usage.length;
    
    return {
      requestsToday,
      requestsRemaining: Math.max(0, 1500 - requestsToday),
      percentUsed: (requestsToday / 1500) * 100,
      isInFreeTier: true
    };
  }
  
  /**
   * Multimodal optimization
   */
  async optimizeMultimodalRequest(
    images: ImageData[],
    prompt: string
  ): Promise<OptimizedRequest> {
    // Resize images to optimal dimensions
    const optimizedImages = await Promise.all(
      images.map(img => this.optimizeImage(img, { maxDimension: 1024 }))
    );
    
    // Estimate token savings
    const originalTokens = images.reduce((sum, img) => 
      sum + estimateImageTokens(img.width, img.height), 0
    );
    const optimizedTokens = optimizedImages.reduce((sum, img) => 
      sum + estimateImageTokens(img.width, img.height), 0
    );
    
    return {
      images: optimizedImages,
      prompt,
      estimatedTokens: optimizedTokens + estimateTextTokens(prompt),
      tokenSavings: originalTokens - optimizedTokens
    };
  }
}
```

### 12.2 OpenAI-Specific Features

```typescript
// src/providers/OpenAIProvider.ts

class OpenAIProvider {
  private openai: OpenAI;
  
  /**
   * Fallback strategy when Gemini hits limits
   */
  async shouldUseAsFallback(operation: OperationType): Promise<boolean> {
    const geminiStatus = await this.geminiProvider.checkFreeTierStatus();
    
    if (geminiStatus.requestsRemaining === 0) {
      return true;
    }
    
    // Use OpenAI for high-quality critical operations
    if (operation === 'branch_generation' && 
        this.userSettings.preferQualityForBranches) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Prompt caching for OpenAI (50% discount)
   */
  async createCachedPrompt(
    prompt: string,
    context: string
  ): Promise<CachedPrompt> {
    // OpenAI automatically caches prompts that appear in 
    // the last 4 tokens of the prompt
    
    return {
      fullPrompt: `${context}\n\n${prompt}`,
      cacheableContext: context,
      estimatedCacheDiscount: 0.5, // 50% off input tokens
      implementationNote: 
        'OpenAI caches automatically. No explicit cache creation needed.'
    };
  }
  
  /**
   * Cost-effective model selection within OpenAI
   */
  selectModel(operation: OperationType): string {
    // GPT-4o is the primary model
    // Could add GPT-4o-mini for cheaper operations in future
    return 'gpt-4o';
  }
}
```

### 12.3 Provider Comparison Matrix

| Feature | Gemini 2.0 Flash | GPT-4o | Winner |
|---------|-----------------|--------|--------|
| Cost per 1M tokens | $0.375 | $6.25 | Gemini |
| Free tier | 1,500 req/day | None | Gemini |
| Context window | 1M tokens | 128K tokens | Gemini |
| Multimodal | Native | Native | Tie |
| Reasoning quality | Good | Excellent | GPT-4o |
| Speed | Fast | Fast | Tie |
| Reliability | Good | Excellent | GPT-4o |
| Context caching | Yes ($0.025/M/hr) | Auto (50% off) | Depends |

### 12.4 Hybrid Strategy Recommendation

```typescript
// src/services/RecommendedStrategy.ts

export const RECOMMENDED_STRATEGY = {
  defaultProvider: 'gemini' as Provider,
  
  fallbackRules: [
    {
      condition: 'gemini_free_tier_exhausted',
      action: 'switch_to_openai',
      notifyUser: true
    },
    {
      condition: 'gemini_rate_limited',
      action: 'wait_and_retry_then_fallback',
      retryDelay: 60000 // 1 minute
    },
    {
      condition: 'complex_reasoning_required',
      action: 'use_openai_with_confirmation',
      costThreshold: 0.10
    }
  ],
  
  optimizationRules: [
    {
      operation: 'analysis',
      tip: 'Analyze 200-page manga in one batch for efficiency'
    },
    {
      operation: 'continuation',
      tip: 'Use context caching after 3rd chapter in same branch'
    },
    {
      operation: 'branch_generation',
      tip: 'Generate 3-5 branches at once to amortize context cost'
    }
  ]
};
```

---

## Appendix A: Pricing Reference

### Current Pricing (as of 2026-02-13)

**Google Gemini:**
- Source: [Google AI Studio Pricing](https://ai.google.dev/pricing)
- Subject to change; verify before implementation

**OpenAI:**
- Source: [OpenAI Pricing](https://openai.com/pricing)
- Subject to change; verify before implementation

### Price Update Detection

```typescript
// Periodically check for pricing updates
async function checkPricingUpdates(): Promise<void> {
  // Store last known pricing in localStorage
  // Compare with fetched pricing on app start
  // Notify user if significant changes detected
}
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Token** | Unit of text processing (≈0.75 words) |
| **Input tokens** | Tokens sent to the model (prompt + context) |
| **Output tokens** | Tokens generated by the model (response) |
| **Context caching** | Reusing context across multiple requests |
| **Free tier** | No-cost usage limits |
| **Pay-as-you-go** | Usage-based billing |
| **Rate limit** | Maximum requests per time period |
| **Multimodal** | Processing text + images |

---

*Document Version: 1.0*  
*Last Updated: 2026-02-13*  
*Next Review: Upon pricing changes or new provider features*
