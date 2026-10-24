---
name: data-analysis-engineer
description: Use this Skill when performing any end-to-end data analysis task including data ingestion, cleaning, exploratory analysis, statistical modeling, machine learning, Bayesian inference, time-series forecasting, causal inference, scientific computing, big data engineering, automated reporting, and deployment of production-grade analytical pipelines using Python, R, MATLAB, and Stan. Trigger this Skill whenever the user requests data cleaning, regression, clustering, prediction, hypothesis testing, Bayesian modeling, signal processing, feature engineering, or any form of data-driven decision support.
---

# Data Analysis Engineer

## Instructions

Provide clear, structured, reproducible, and statistically valid guidance for complete data analysis workflows. When executing any analytical, statistical, or data processing task, strictly guide the runtime through the end-to-end pipeline phases defined below. Always select the optimal tool based on the task type, data structure, and analytical objective.

### Tool Selection Matrix

| Tool | When to Use |
|------|-------------|
| **Python** | General data engineering, large-scale machine learning, preprocessing pipelines, API workflows, production deployment (`pandas`, `numpy`, `scikit-learn`, `statsmodels`, `PyMC`) |
| **R** | Core statistical analysis, econometrics, biostatistics, hypothesis testing, survey analysis, academic reporting (`tidyverse`, `ggplot2`, `lme4`, `brms`, `rstan`, `forecast`) |
| **MATLAB** | Signal processing, control systems, matrix-heavy engineering computations, simulation outputs, FFT analysis, scientific experiments |
| **Stan** | Full Bayesian statistical modeling, MCMC sampling, hierarchical models, latent variable models, uncertainty quantification (`cmdstanr`, `pystan`, `cmdstanpy`) |

---

## Core Pipeline Phases

### Phase 1 — Problem Definition & Data Understanding

Before initiating any analysis, always define and document:

- Business or research objective
- Target question (descriptive, diagnostic, predictive, prescriptive, or causal)
- Data sources, unit of analysis, and variable roles
- Data type (cross-sectional, longitudinal, panel, time-series, spatial, experimental, observational)
- Expected output and success metrics
- Constraints, assumptions, and known limitations

---

### Phase 2 — Data Ingestion & Collection

Support data import from multiple formats and sources:

- Flat files: CSV, Excel, JSON, XML, TSV
- Databases: PostgreSQL, MySQL, SQL Server, SQLite, MongoDB, BigQuery, Snowflake, Redshift
- Statistical formats: SPSS, Stata, SAS, MATLAB `.mat`, R data files
- APIs, web scraping outputs, sensor data, log files, survey platforms

**Python:**
```python
import pandas as pd
df = pd.read_csv("data.csv")
df = pd.read_excel("data.xlsx")
```

**R:**
```r
library(readr)
library(readxl)
df <- read_csv("data.csv")
df <- read_excel("data.xlsx")
```

**MATLAB:**
```matlab
T = readtable('data.csv');
data = load('experiment.mat');
```

---

### Phase 3 — Data Cleaning & Validation

Perform a complete and explicit cleaning workflow:

**Operations:**
- Remove duplicate records
- Handle missing values (listwise deletion, mean/median/mode imputation, KNN, regression, multiple imputation, Bayesian missing-data modeling)
- Correct inconsistent formats and data types
- Standardize column names
- Detect impossible or out-of-range values
- Normalize categorical labels
- Parse dates and timestamps
- Validate ranges and domain-specific constraints
- Verify normality where required (Shapiro-Wilk, Anderson-Darling, Kolmogorov-Smirnov)

**Outlier Handling:**
- Z-score detection
- IQR method
- Isolation Forest
- Local Outlier Factor
- Winsorization
- Domain-based rule validation

**Python:**
```python
from sklearn.impute import KNNImputer
import numpy as np

# Drop duplicates
df = df.drop_duplicates()

# Impute missing values using KNN
imputer = KNNImputer(n_neighbors=5)
df_imputed = pd.DataFrame(imputer.fit_transform(df), columns=df.columns)

# Z-score outlier removal
from scipy import stats
df = df[(np.abs(stats.zscore(df.select_dtypes(include=np.number))) < 3).all(axis=1)]
```

**R:**
```r
library(tidyverse)
library(mice)

# Remove duplicates and impute missing values
df_clean <- df %>% distinct()
imputed <- mice(df_clean, m = 5, method = "pmm", seed = 42)
df_final <- complete(imputed, 1)
```

---

### Phase 4 — Exploratory Data Analysis (EDA)

Perform thorough exploration to discover structure, patterns, and anomalies:

**Summary Statistics:**
- Central tendency, dispersion, skewness, kurtosis
- Frequency tables and cross-tabulations
- Missingness maps

**Correlation & Association:**
- Pearson, Spearman, Kendall correlation matrices
- Variance Inflation Factor (VIF) for multicollinearity detection
- Chi-square tests for categorical relationships

**Visualizations:**
- Histograms, box plots, violin plots, density plots
- Scatter plots, pair plots, heatmaps
- Bar charts, line charts, time-series plots
- Geographic maps and interactive dashboards

**Python:**
```python
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.stats.outliers_influence import variance_inflation_factor

# Correlation heatmap
sns.heatmap(df.corr(), annot=True, cmap="coolwarm")
plt.title("Correlation Matrix")
plt.tight_layout()
plt.savefig("reports/figures/correlation_heatmap.png", dpi=150)

# VIF check
features = df.drop(columns=["target"])
vif = pd.DataFrame({
    "Feature": features.columns,
    "VIF": [variance_inflation_factor(features.values, i) for i in range(features.shape[1])]
})
print(vif[vif["VIF"] > 5])
```

**R:**
```r
library(ggplot2)
library(GGally)

# Pair plot
ggpairs(df, columns = 1:5, aes(color = group))

# Correlation matrix
library(corrplot)
corrplot(cor(df[, sapply(df, is.numeric)]), method = "color", type = "upper")
```

---

### Phase 5 — Feature Engineering & Transformation

Prepare analysis-ready datasets:

- Scaling: Min-Max normalization, standardization (Z-score)
- Transformation: Log, Box-Cox, Yeo-Johnson
- Encoding: One-hot, label, target, ordinal encoding
- Feature extraction: PCA components, rolling averages, lag features, interaction terms, polynomial features
- Time-series features: Differencing, seasonal decomposition, stationarity tests (ADF, KPSS), moving averages
- Text features: TF-IDF, word embeddings, topic modeling, sentiment scores

---

### Phase 6 — Statistical Analysis

Apply the appropriate statistical method based on the data type and research question:

**Descriptive & Inferential:**
- T-tests (one-sample, independent, paired)
- ANOVA / MANOVA with post-hoc tests (Tukey, Bonferroni, Scheffé)
- Chi-square tests
- Non-parametric alternatives (Mann-Whitney U, Kruskal-Wallis, Wilcoxon)
- Confidence intervals and effect sizes (Cohen's d, eta-squared, Cramér's V)

**Regression Models:**
- Linear, multiple linear, polynomial, logistic, ordinal, Poisson, negative binomial
- Ridge, Lasso, Elastic Net regularized regression
- Quantile regression, robust regression
- Mixed-effects models (LME, GLMM)

**Model Diagnostics:**
- Normality of residuals
- Homoscedasticity (Breusch-Pagan, White test)
- Multicollinearity (VIF)
- Autocorrelation (Durbin-Watson)
- Influential observations (Cook's distance, leverage)

**R:**
```r
# Multiple linear regression with diagnostics
model <- lm(outcome ~ predictor1 + predictor2 + predictor3, data = df)
summary(model)
plot(model)  # Residual diagnostics

# ANOVA with post-hoc
aov_model <- aov(score ~ group, data = df)
TukeyHSD(aov_model)
```

**Python:**
```python
import statsmodels.api as sm

X = sm.add_constant(df[["x1", "x2", "x3"]])
model = sm.OLS(df["y"], X).fit()
print(model.summary())
```

---

### Phase 7 — Machine Learning

**Supervised Learning:**
- Linear and logistic regression, decision trees, random forests, gradient boosting (XGBoost, LightGBM, CatBoost), support vector machines, neural networks

**Unsupervised Learning:**
- K-means, hierarchical clustering, DBSCAN, Gaussian Mixture Models
- PCA, t-SNE, UMAP
- Association rule mining (Apriori, FP-Growth)

**Validation & Tuning:**
- Train/test split, stratified K-fold cross-validation, time-series split
- Grid search, random search, Bayesian hyperparameter optimization
- Feature importance, SHAP values, partial dependence plots

**Evaluation Metrics:**
- Classification: Accuracy, Precision, Recall, F1-score, ROC-AUC, PR-AUC, log-loss, confusion matrix
- Regression: RMSE, MAE, MAPE, R², Adjusted R²
- Clustering: Silhouette score, Davies-Bouldin index, Calinski-Harabasz index

**Python:**
```python
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report

model = GradientBoostingClassifier(n_estimators=200, learning_rate=0.05, random_state=42)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=cv, scoring="roc_auc")
print(f"ROC-AUC: {scores.mean():.4f} ± {scores.std():.4f}")

model.fit(X_train, y_train)
print(classification_report(y_test, model.predict(X_test)))
```

---

### Phase 8 — Bayesian Modeling with Stan

Use Stan when:
- Uncertainty quantification is essential
- Data is small, noisy, hierarchical, or structurally complex
- Prior domain knowledge should be formally incorporated
- Full posterior distributions are required rather than point estimates

**Stan Model Types:**
- Bayesian linear and logistic regression
- Hierarchical / multilevel models
- Latent variable and measurement error models
- Bayesian time-series models
- Bayesian survival analysis
- Bayesian A/B testing and causal models

**Always include:**
- Explicit model specification with blocks: `data`, `parameters`, `transformed parameters`, `model`, `generated quantities`
- Priors with justification
- Likelihood function
- Convergence diagnostics: R-hat (< 1.01), Effective Sample Size, trace plots, divergent transitions
- Posterior predictive checks
- LOO-CV or WAIC for model comparison

**R with cmdstanr:**
```r
library(cmdstanr)

stan_data <- list(
  N = nrow(df),
  x = df$predictor,
  y = df$outcome
)

mod <- cmdstan_model("model.stan")
fit <- mod$sample(
  data = stan_data,
  seed = 123,
  chains = 4,
  parallel_chains = 4,
  iter_warmup = 1000,
  iter_sampling = 2000,
  refresh = 500
)

print(fit$summary(c("alpha", "beta", "sigma")))
fit$cmdstan_diagnose()
```

**Stan model file (`model.stan`):**
```stan
data {
  int<lower=0> N;
  vector[N] x;
  vector[N] y;
}
parameters {
  real alpha;
  real beta;
  real<lower=0> sigma;
}
model {
  // Priors
  alpha ~ normal(0, 10);
  beta ~ normal(0, 5);
  sigma ~ exponential(1);
  // Likelihood
  y ~ normal(alpha + beta * x, sigma);
}
generated quantities {
  vector[N] y_rep;
  for (n in 1:N)
    y_rep[n] = normal_rng(alpha + beta * x[n], sigma);
}
```

---

### Phase 9 — Time-Series Analysis

Handle temporal data rigorously:

- Stationarity testing (ADF, KPSS, PP test)
- Seasonal decomposition (STL, classical)
- ARIMA / SARIMA / ARIMAX modeling with auto-selection (auto.arima)
- VAR models for multivariate time-series
- Exponential smoothing (ETS)
- Prophet-style decomposition forecasting
- LSTM / GRU deep learning models
- Bayesian structural time-series models
- Change-point detection

**Evaluation:**
- Forecast accuracy (RMSE, MAE, MAPE, MASE)
- Rolling-window backtesting
- Prediction intervals with coverage assessment

**Python:**
```python
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.stattools import adfuller

# Stationarity test
result = adfuller(df["sales"])
print(f"ADF Statistic: {result[0]:.4f}, p-value: {result[1]:.4f}")

# SARIMA model
model = SARIMAX(df["sales"], order=(1,1,1), seasonal_order=(1,1,1,12))
fit = model.fit(disp=False)
print(fit.summary())
forecast = fit.forecast(steps=12)
```

---

### Phase 10 — Causal Inference & Experimental Analysis

Strictly distinguish between correlation, association, and causation. Apply the appropriate causal framework:

- Randomized controlled trials and A/B testing
- Difference-in-differences (DiD)
- Propensity score matching (PSM)
- Instrumental variables (IV) estimation
- Regression discontinuity design (RDD)
- Causal forests and heterogeneous treatment effects
- Synthetic control method
- Directed Acyclic Graphs (DAG) specification
- Mediation and moderation analysis

Always document:
- Identification strategy and assumptions
- Balance tests (pre-treatment covariate equivalence)
- Sensitivity analyses for unmeasured confounding

---

### Phase 11 — MATLAB for Scientific & Engineering Analysis

Use MATLAB when working with engineering data, simulation outputs, or matrix-intensive computations:

```matlab
% Signal processing example
data = load('sensor_data.mat');
signal = data.signal;

% Noise filtering
Fs = 1000; % Sampling frequency
[b, a] = butter(4, 0.1, 'low');
filtered = filtfilt(b, a, signal);

% FFT analysis
N = length(filtered);
f = (0:N-1)*(Fs/N);
Y = fft(filtered);
power = abs(Y).^2 / N;

% Visualization
figure;
tiledlayout(2, 1);
nexttile; plot(signal); title('Raw Signal');
nexttile; plot(f(1:N/2), power(1:N/2)); title('Power Spectrum'); xlabel('Hz');
```

---

### Phase 12 — Big Data & Data Engineering

Handle large-scale datasets and production pipelines:

- SQL-based transformation (PostgreSQL, Snowflake, BigQuery, Redshift)
- Distributed computing (PySpark, Dask, Polars)
- ETL / ELT pipeline design with validation layers
- Feature stores and analytical data marts
- Batch and stream processing architectures

```python
import polars as pl

df = pl.scan_parquet("large_dataset/*.parquet")
result = (
    df
    .filter(pl.col("status") == "active")
    .groupby("region")
    .agg([
        pl.col("revenue").sum().alias("total_revenue"),
        pl.col("customer_id").n_unique().alias("unique_customers")
    ])
    .sort("total_revenue", descending=True)
    .collect()
)
print(result)
```

---

### Phase 13 — Multicollinearity Filtering (Reusable Utility)

```python
import numpy as np
import pandas as pd
from statsmodels.stats.outliers_influence import variance_inflation_factor

def filter_multicollinearity(df: pd.DataFrame, target_column: str, threshold: float = 5.0) -> pd.DataFrame:
    """
    Iteratively removes features with VIF above the specified threshold
    to eliminate multicollinearity before regression modeling.
    """
    df_clean = df.dropna().copy()
    features = df_clean.drop(columns=[target_column]).select_dtypes(include=[np.number])

    while True:
        vif_data = pd.DataFrame({
            "feature": features.columns,
            "VIF": [variance_inflation_factor(features.values, i) for i in range(features.shape[1])]
        })
        max_vif = vif_data["VIF"].max()
        if max_vif > threshold:
            drop_feature = vif_data.loc[vif_data["VIF"].idxmax(), "feature"]
            print(f"Dropping '{drop_feature}' with VIF = {max_vif:.2f}")
            features = features.drop(columns=[drop_feature])
        else:
            break

    return df_clean[list(features.columns) + [target_column]]
```

---

### Phase 14 — Result Interpretation

After every model, always produce:

- Clear plain-language result summary
- Statistical significance (p-values, confidence/credible intervals)
- Practical significance (effect sizes, magnitude of impact)
- Model limitations and violated assumptions
- Possible sources of bias (selection, confounding, measurement error)
- Actionable recommendations with uncertainty clearly communicated
- Next analytical steps

---

### Phase 15 — Reporting & Deliverables

Generate professional outputs structured as:

```
1. Executive Summary
2. Data Description
3. Data Cleaning Process
4. Exploratory Data Analysis
5. Methodology
6. Modeling / Statistical Analysis
7. Results
8. Interpretation
9. Limitations
10. Recommendations
11. Appendix (code, tables, supplementary figures)
```

Output formats: Cleaned dataset, analysis notebook (Jupyter / R Markdown), statistical report, executive summary, technical documentation, visual dashboards (Streamlit, Shiny, Plotly Dash), presentation-ready charts, and reproducible pipelines.

---

### Phase 16 — Quality Control & Validation

Always verify:

- Data completeness, consistency, accuracy, and absence of duplicates
- Absence of data leakage across train/test splits
- Sampling representativeness and class balance
- Model assumptions (normality, homoscedasticity, independence, linearity)
- Overfitting and underfitting through cross-validation
- Reproducibility (fixed random seeds, versioned data and code)
- Sensitivity of conclusions to modeling choices

---

### Phase 17 — Automation & Deployment

Support production-ready analytical systems:

- Automated ETL/ELT pipelines (Airflow, Prefect, Dagster)
- Model retraining workflows (MLflow, DVC)
- Live dashboard updates (Streamlit, Shiny, Grafana)
- API-based model serving (FastAPI, Flask)
- Scheduled reporting and alerting systems
- Containerized environments (Docker, GitHub Actions CI/CD)

---

## Project Structure

Maintain a clean, reproducible project layout:

```
/data-analysis-project
  /data
    /raw              # Never modify raw data
    /processed        # Cleaned, transformed datasets
    /external         # Third-party reference data

  /notebooks
    01_eda.ipynb
    02_modeling.ipynb

  /src
    /cleaning         # Data cleaning scripts
    /features         # Feature engineering
    /models           # Model training and evaluation
    /visualization    # Chart generation
    /utils            # Shared helper functions

  /reports
    /figures          # All generated charts
    final_report.md

  /models
    trained_model.pkl
    bayesian_model.stan

  /scripts
    run_pipeline.py
    train_model.py
    generate_report.py

  /config
    config.yaml

  README.md
  requirements.txt
```

**Rules:**
- Never overwrite raw data.
- Store processed data separately.
- Track all assumptions and modeling decisions.
- Use version control (Git) for all code and configuration.
- Fix all random seeds for reproducibility.

---

## Examples

### Example 1 — Full Data Cleaning, EDA, and Modeling (Python)

**User Request:** Analyze this customer dataset, clean it, and build a churn prediction model.

**Agent Workflow:**
1. Inspect data shape, dtypes, and missingness
2. Remove duplicates, impute missing values with KNN
3. Remove outliers using IQR and Z-score
4. Encode categorical features (one-hot)
5. Generate correlation heatmap and distribution plots
6. Apply VIF filter to remove multicollinear features
7. Train logistic regression, random forest, and XGBoost classifiers
8. Evaluate with ROC-AUC, F1-score, precision, recall
9. Compute SHAP values for feature importance
10. Report results, limitations, and business recommendations

---

### Example 2 — Bayesian Hierarchical Regression (R + Stan)

**User Request:** Estimate treatment effect across multiple sites using Bayesian hierarchical modeling.

**Agent Workflow:**
1. Define likelihood and group-level priors
2. Write Stan model with `data`, `parameters`, `model`, and `generated quantities` blocks
3. Run 4 chains × 2000 iterations with `cmdstanr`
4. Check R-hat (< 1.01), effective sample size, and trace plots
5. Run posterior predictive checks
6. Compute LOO-CV for model comparison
7. Report group-level and pooled credible intervals with full uncertainty characterization

---

### Example 3 — Statistical Hypothesis Testing (R)

**User Request:** Test whether three treatment groups have significantly different outcomes.

**Agent Workflow:**
1. Check normality (Shapiro-Wilk) and homogeneity of variance (Levene's test)
2. Run one-way ANOVA if assumptions hold; Kruskal-Wallis otherwise
3. Report F-statistic (or H-statistic), p-value, and effect size (eta-squared)
4. Perform post-hoc comparisons (Tukey HSD or Dunn test)
5. Visualize group differences with box plots and mean ± SE bar charts
6. Provide plain-language interpretation of practical significance

---

### Example 4 — Time-Series Forecasting (Python)

**User Request:** Forecast monthly revenue for the next 12 months.

**Agent Workflow:**
1. Aggregate and plot time-series with trend and seasonality decomposition
2. Test stationarity using ADF and KPSS; difference if non-stationary
3. Fit and compare ARIMA, SARIMA, ETS, and Prophet models
4. Validate using rolling-window backtesting (last 12 months held out)
5. Select best model by RMSE and MAPE
6. Generate 12-month forecast with 80% and 95% prediction intervals
7. Explain expected trend, seasonal components, and uncertainty bounds

---

### Example 5 — MATLAB Signal Analysis

**User Request:** Analyze sensor signals from an industrial experiment and extract dominant frequencies.

**Agent Workflow:**
1. Import raw signal matrices from `.mat` file
2. Clean noise using a 4th-order Butterworth low-pass filter
3. Perform FFT and compute power spectral density
4. Extract dominant frequency peaks and their magnitudes
5. Visualize time-domain and frequency-domain representations side by side
6. Export processed results as CSV for downstream analysis
7. Report findings with engineering interpretation

---

### Example 6 — Causal Impact Estimation

**User Request:** Measure the revenue effect of a new marketing intervention.

**Agent Workflow:**
1. Define treatment and control groups with clear assignment mechanism
2. Check pre-treatment covariate balance (standardized mean differences)
3. Apply difference-in-differences estimation with parallel trends test
4. Use propensity score matching as robustness check
5. Estimate average treatment effect (ATE) with 95% confidence intervals
6. Run sensitivity analysis for unmeasured confounding (Rosenbaum bounds)
7. Clearly state whether the estimated effect is causal or merely associative

---

### Example 7 — Automated Weekly Analytics Report

**User Request:** Build an automated pipeline that generates a clean analytics report every week.

**Agent Workflow:**
1. Build data ingestion pipeline from SQL database using SQLAlchemy
2. Apply cleaning and transformation scripts
3. Compute KPIs (revenue, conversion rate, churn, engagement)
4. Generate charts using matplotlib and seaborn with consistent styling
5. Export report as PDF and HTML using Jinja2 templates
6. Schedule via Airflow DAG with email notification on completion
7. Add data validation checks and logging with automatic failure alerts
