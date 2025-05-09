document.addEventListener('DOMContentLoaded', function() {
    // Form submission
    const form = document.getElementById('pricePredictionForm');
    const resultsContainer = document.getElementById('results');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const formData = {
            location: document.getElementById('location').value,
            sqft: parseInt(document.getElementById('sqft').value),
            yearBuilt: parseInt(document.getElementById('yearBuilt').value),
            bedrooms: parseInt(document.getElementById('bedrooms').value),
            bathrooms: parseFloat(document.getElementById('bathrooms').value),
            propertyType: document.querySelector('input[name="propertyType"]:checked').value,
            amenities: Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(el => el.value)
        };
        
        // Simulate prediction (in a real app, this would be an API call)
        const predictionResult = predictPrice(formData);
        
        // Display results
        displayResults(predictionResult);
        
        // Show results container
        resultsContainer.classList.remove('hidden');
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Initialize market trends chart
    initMarketTrendsChart();
    
    // Set sample market data
    setMarketData();
});

// Simulated prediction function (in a real app, this would call your backend API)
function predictPrice(formData) {
    // Base price based on square footage
    let basePrice = formData.sqft * 180;
    
    // Adjustments for different factors
    const adjustments = {
        // Location adjustment (simplified - in reality this would be more complex)
        location: (parseInt(formData.location) % 100) * 500,
        
        // Age adjustment (newer homes are more valuable)
        age: (2023 - formData.yearBuilt) * -100,
        
        // Bedrooms adjustment
        bedrooms: (formData.bedrooms - 3) * 15000,
        
        // Bathrooms adjustment
        bathrooms: (formData.bathrooms - 2) * 10000,
        
        // Property type adjustments
        propertyType: {
            single_family: 0,
            condo: -20000,
            townhouse: -15000
        }[formData.propertyType],
        
        // Amenities adjustments
        amenities: formData.amenities.reduce((total, amenity) => {
            return total + {
                garage: 15000,
                pool: 25000,
                basement: 20000,
                fireplace: 5000
            }[amenity] || 0;
        }, 0)
    };
    
    // Calculate total price
    const totalPrice = basePrice + 
        adjustments.location + 
        adjustments.age + 
        adjustments.bedrooms + 
        adjustments.bathrooms + 
        adjustments.propertyType + 
        adjustments.amenities;
    
    // Calculate confidence (simplified)
    const confidence = 85 + Math.random() * 10; // 85-95%
    
    // Calculate price range (+/- 5-10%)
    const rangePercent = 0.075;
    const lowEstimate = totalPrice * (1 - rangePercent);
    const highEstimate = totalPrice * (1 + rangePercent);
    
    // Prepare factors for visualization
    const factors = {
        'Square Footage': basePrice,
        'Location': adjustments.location,
        'Home Age': adjustments.age,
        'Bedrooms': adjustments.bedrooms,
        'Bathrooms': adjustments.bathrooms,
        'Property Type': adjustments.propertyType,
        'Amenities': adjustments.amenities
    };
    
    return {
        price: totalPrice,
        confidence: confidence,
        lowEstimate: lowEstimate,
        highEstimate: highEstimate,
        factors: factors
    };
}

function displayResults(result) {
    // Display predicted price
    document.getElementById('predictedPrice').textContent = formatCurrency(result.price);
    
    // Display confidence
    document.getElementById('confidenceLevel').textContent = `${Math.round(result.confidence)}%`;
    
    // Display price range
    document.getElementById('lowEstimate').textContent = formatCurrency(result.lowEstimate);
    document.getElementById('highEstimate').textContent = formatCurrency(result.highEstimate);
    
    // Set range bar width (visual representation of confidence)
    const rangeFill = document.getElementById('rangeFill');
    const rangeWidth = (result.confidence / 100) * 80 + 10; // 10-90% of container
    rangeFill.style.width = `${rangeWidth}%`;
    
    // Create factors chart
    createFactorsChart(result.factors);
}

function formatCurrency(amount) {
    return '$' + Math.round(amount).toLocaleString();
}

function createFactorsChart(factors) {
    const ctx = document.getElementById('factorsChart').getContext('2d');
    
    // Sort factors by absolute value for better visualization
    const sortedFactors = Object.entries(factors)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[0]));
    
    const labels = sortedFactors.map(item => item[0]);
    const data = sortedFactors.map(item => item[1]);
    const colors = data.map(value => value >= 0 ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)');
    
    // Destroy previous chart if it exists
    if (window.factorsChart) {
        window.factorsChart.destroy();
    }
    
    window.factorsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Impact on Price',
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Impact ($)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

function initMarketTrendsChart() {
    const ctx = document.getElementById('marketTrendsChart').getContext('2d');
    
    window.marketTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Median Home Price',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Median Price: ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

function setMarketData() {
    // Simulated market data
    const basePrice = 350000;
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        // Simulate seasonal variations
        const seasonalAdjustment = Math.sin(i / 2) * 0.05;
        // Simulate overall market trend
        const trendAdjustment = i * 0.01;
        // Random fluctuation
        const randomAdjustment = (Math.random() - 0.5) * 0.02;
        
        return basePrice * (1 + seasonalAdjustment + trendAdjustment + randomAdjustment);
    });
    
    // Update chart
    window.marketTrendsChart.data.datasets[0].data = monthlyData;
    window.marketTrendsChart.update();
    
    // Set market stats
    document.getElementById('avgPrice').textContent = formatCurrency(basePrice);
    document.getElementById('priceChange').textContent = '+6.5%';
    document.getElementById('daysOnMarket').textContent = '32';
}