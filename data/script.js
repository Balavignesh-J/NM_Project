document.addEventListener('DOMContentLoaded', function() {
    // Form submission
    const form = document.getElementById('pricePredictionForm');
    const resultsContainer = document.getElementById('results');
    
    form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get submit button and add loading state
    const predictButton = e.target.querySelector('button[type="submit"]');
    predictButton.disabled = true;
    predictButton.innerHTML = `
        <span class="spinner">
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/>
                <path fill="currentColor" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z">
                    <animateTransform attributeName="transform" type="rotate" dur="0.75s" repeatCount="indefinite" from="0 12 12" to="360 12 12"/>
                </path>
            </svg>
            Calculating...
        </span>
    `;

    // Simulate API delay (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get form values (YOUR EXISTING CODE)
    const formData = {
        location: document.getElementById('location').value,
        sqft: parseInt(document.getElementById('sqft').value),
        yearBuilt: parseInt(document.getElementById('yearBuilt').value),
        bedrooms: parseInt(document.getElementById('bedrooms').value),
        bathrooms: parseFloat(document.getElementById('bathrooms').value),
        propertyType: document.querySelector('input[name="propertyType"]:checked').value,
        amenities: Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(el => el.value)
    };

    // Simulate prediction
    const predictionResult = predictPrice(formData);

    // Reset button state
    predictButton.disabled = false;
    predictButton.textContent = 'Estimate Price';

    // Display results (YOUR EXISTING CODE)
    displayResults(predictionResult);
    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Initialize market trends chart
    initMarketTrendsChart();
    
    // Set sample market data
    setMarketData();
});

// Simulated prediction function (in a real app, this would call your backend API)
function predictPrice(formData) {
    // Validate inputs
    if (formData.sqft <= 0 || formData.yearBuilt < 1800) {
        return { error: "Invalid input values" };
    }

    // Base price (adjust $/sqft based on location)
    const pricePerSqFt = 180; // Default, could vary by ZIP code
    let basePrice = formData.sqft * pricePerSqFt;

    // Location adjustment (simulate regional differences)
    let zipCode = parseInt(formData.location) || 10000; // Fallback for invalid ZIP
    const locationAdjustment = (zipCode % 100) * 500;

    // Age adjustment (newer = higher value)
    const ageAdjustment = (new Date().getFullYear() - formData.yearBuilt) * -100;

    // Bedrooms/bathrooms adjustments
    const bedroomAdjustment = (formData.bedrooms - 3) * 15000;
    const bathroomAdjustment = (formData.bathrooms - 2) * 10000;

    // Property type adjustments
    const propertyTypeAdjustment = {
        single_family: 0,
        condo: -20000,
        townhouse: -15000
    }[formData.propertyType];

    // Amenities adjustments
    const amenitiesAdjustment = formData.amenities.reduce((total, amenity) => {
        return total + {
            garage: 15000,
            pool: 25000,
            basement: 20000,
            fireplace: 5000
        }[amenity] || 0;
    }, 0);

    // Calculate total price
    const totalPrice = basePrice + locationAdjustment + ageAdjustment + 
                       bedroomAdjustment + bathroomAdjustment + 
                       propertyTypeAdjustment + amenitiesAdjustment;

    // Return results
    return {
        price: Math.max(totalPrice, 50000), // Ensure minimum $50K
        confidence: 85 + Math.random() * 10, // 85-95%
        lowEstimate: totalPrice * 0.925, // -7.5%
        highEstimate: totalPrice * 1.075, // +7.5%
        factors: {
            'Base Price': basePrice,
            'Location': locationAdjustment,
            'Home Age': ageAdjustment,
            'Bedrooms': bedroomAdjustment,
            'Bathrooms': bathroomAdjustment,
            'Property Type': propertyTypeAdjustment,
            'Amenities': amenitiesAdjustment
        }
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