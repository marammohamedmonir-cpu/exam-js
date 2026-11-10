
const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const pageInfo = {
    dashboard: {
        title: "Dashboard",
        subtitle: "Your travel overview"
    },
    holidays: {
        title: "Holidays",
        subtitle: "Explore public holidays around the world"
    },
    events: {
        title: "Events",
        subtitle: "Find concerts, sports, and entertainment"
    },
    weather: {
        title: "Weather",
        subtitle: "Check forecasts for any destination"
    },
    "long-weekends": {
        title: "Long Weekends",
        subtitle: "Find the perfect mini-trip opportunities"
    },
    currency: {
        title: "Currency",
        subtitle: "Convert currencies with live exchange rates"
    },
    "sun-times": {
        title: "Sun Times",
        subtitle: "Check sunrise and sunset times worldwide"
    },
    "my-plans": {
        title: "My Plans",
        subtitle: "Manage your saved travel plans"
    }
};
const countrySelect = document.getElementById("global-country");
const citySelect = document.getElementById("global-city");
const yearSelect = document.getElementById("global-year");
const searchButton = document.getElementById("global-search-btn");
const clearButton = document.getElementById("clear-selection-btn");
const selectedDestination = document.getElementById("selected-destination");
const selectedCountryFlag = document.getElementById("selected-country-flag");
const selectedCountryName = document.getElementById("selected-country-name");
const selectedCityName = document.getElementById("selected-city-name");
const countryInfoContainer = document.getElementById("dashboard-country-info");
const holidaysGrid = document.getElementById("holidays-grid");
const noCitySelected = document.getElementById("no-city-selected");
const eventsContent = document.getElementById("events-content");
const goToDashboardBtn = document.getElementById("go-to-dashboard");
const COUNTRIES_API =
    "https://date.nager.at/api/v3/AvailableCountries";
const CITIES_API =
    "https://countriesnow.space/api/v0.1/countries/cities";
const REST_COUNTRIES_API =
    "https://restcountries.com/v3.1/alpha/";
const HOLIDAYS_API =
    "https://date.nager.at/api/v3/PublicHolidays";
const TICKETMASTER_API =
    "https://app.ticketmaster.com/discovery/v2/events.json";
const TICKETMASTER_API_KEY = "VwECw2OiAzxVzIqnwmKJUG41FbeXJk1y";
const appState = {
    selectedCountry: "EG",
    selectedCountryName: "",
    selectedCity: "",
    selectedYear: yearSelect?.value || "2026",
    countryData: null
};
let citiesRequestId = 0;
let eventsRequestId = 0;
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return entities[char];
    });
}
navItems.forEach(item => {
    item.addEventListener("click", event => {
        event.preventDefault();
        const selectedView = item.getAttribute("data-view");
        navItems.forEach(nav => {
            nav.classList.remove("active");
        });
        views.forEach(view => {
            view.classList.remove("active");
        });
        item.classList.add("active");
        const selectedSection = document.getElementById(
            selectedView + "-view"
        );
        if (selectedSection) {
            selectedSection.classList.add("active");
        }
        if (pageInfo[selectedView]) {
            pageTitle.textContent = pageInfo[selectedView].title;
            pageSubtitle.textContent = pageInfo[selectedView].subtitle;
        }
       if (selectedView === "holidays") {
    getPublicHolidays(
        appState.selectedYear,
        appState.selectedCountry
    );
}
if (selectedView === "events") {
    getTicketmasterEvents();
}
if (selectedView === "weather") {
    if (appState.selectedCity) {
        getWeatherForecast(
            appState.selectedCity,
            appState.selectedCountry
        );
    } else {
        document.getElementById("weather-content").innerHTML =
            "<p>Please select a country and city first.</p>";
    }
}
    });
});
async function getCountries() {
    countrySelect.innerHTML = `
        <option value="">Loading countries...</option>
    `;
    countrySelect.disabled = true;
    try {
        const response = await fetch(COUNTRIES_API);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        const countries = await response.json();

        countrySelect.innerHTML = `
            <option value="">Select Country</option>
        `;
        countries.forEach(country => {

            const option = document.createElement("option");

            option.value = country.countryCode;

            option.textContent = country.name;

            countrySelect.appendChild(option);

        });

        countrySelect.disabled = false;
        countrySelect.value = "EG";

        if (countrySelect.value) {

            countrySelect.dispatchEvent(
                new Event("change")
            );

        }

    } catch (error) {
        console.error("Countries Error:", error);
        countrySelect.innerHTML = `
            <option value="EG">Egypt</option>
        `;
        countrySelect.disabled = false;
        countrySelect.value = "EG";
        countrySelect.dispatchEvent(
            new Event("change")
        );
    }
}
async function loadCities(countryName) {
    const requestId = ++citiesRequestId;
    appState.selectedCity = "";
    citySelect.innerHTML = `
        <option value="">Loading cities...</option>
    `;
    citySelect.disabled = true;
    if (selectedCityName) {
        selectedCityName.textContent = "";
    }
    if (noCitySelected) {
        noCitySelected.hidden = false;
    }
    if (eventsContent) {
        eventsContent.hidden = true;
    }
    if (!countryName) {
        citySelect.innerHTML = `
            <option value="">Select City</option>
        `;
        citySelect.disabled = false;
        return;
    }
    try {
        const response = await fetch(CITIES_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                country: countryName
            })
        });

        if (!response.ok) {
            throw new Error(`Cities API Error: ${response.status}`);
        }

        const result = await response.json();
        if (requestId !== citiesRequestId) {
            return;
        }
        if (result.error || !Array.isArray(result.data)) {
            throw new Error(result.msg || "Invalid cities response");
        }
        const cities = [...new Set(
            result.data
                .filter(city =>
                    typeof city === "string" && city.trim() !== ""
                )
                .map(city => city.trim())

        )].sort((a, b) => a.localeCompare(b));

        citySelect.innerHTML = `
            <option value="">Select City</option>
        `;

        if (cities.length === 0) {

            citySelect.innerHTML = `
                <option value="">No cities available</option>
            `;
            return;
        }
        cities.forEach(city => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Cities Error:", error);
        if (requestId !== citiesRequestId) {
            return;
        }
        citySelect.innerHTML = `
            <option value="">Unable to load cities</option>
        `;
    } finally {
        if (requestId === citiesRequestId) {
            citySelect.disabled = false;
        }
    }
}
countrySelect.addEventListener("change", async () => {
    const countryCode = countrySelect.value;
    const selectedOption =
        countrySelect.options[countrySelect.selectedIndex];

    const countryName = countryCode
        ? selectedOption.textContent.trim()
        : "";

    appState.selectedCountry = countryCode;
    appState.selectedCountryName = countryName;
    appState.selectedCity = "";
    appState.countryData = null;

    updateSunTimesSelection();

    await loadCities(countryName);
});
citySelect.addEventListener("change", () => {
    appState.selectedCity = citySelect.value;
     updateSunTimesSelection();
    if (selectedCityName) {
        selectedCityName.textContent =
            appState.selectedCity
                ? `• ${appState.selectedCity}`
                : "";
    }
    if (appState.selectedCity) {
        getTicketmasterEvents();
        getWeatherForecast(
            appState.selectedCity,
            appState.selectedCountry
        );
    }
});
yearSelect.addEventListener("change", () => {

    appState.selectedYear = yearSelect.value;

});
async function getCountryInfo(countryCode) {
    if (!countryCode) {
        alert("Please select a country first.");
        return;
    }
    try {
        countryInfoContainer.innerHTML = `
            <p>Loading country information...</p>
        `;
        const response = await fetch(
            `${REST_COUNTRIES_API}${encodeURIComponent(countryCode)}`
        );
        if (!response.ok) {
            throw new Error(
                `Country API returned HTTP ${response.status}`
            );
        }
        const data = await response.json();
        const country = Array.isArray(data) ? data[0] : data;
        if (!country) {
            throw new Error("Country information was not found.");
        }
        appState.countryData = country;
        appState.selectedCountry = countryCode;
        displayCountryInfo(country);
        updateSelectedDestination(country);
    } catch (error) {
        console.error("Country Information Error:", error);
        showError();
    }
}
function displayCountryInfo(country) {
    const countryName =
        country.name?.common || "Not available";
    const officialName =
        country.name?.official || "Not available";
    const flag =
        country.flags?.png ||
        country.flags?.svg ||
        "";
    const region =
        country.region || "Not available";
    const subregion =
        country.subregion || "";
    const capital =
        country.capital?.join(", ") || "Not available";
    const population =
        country.population != null
            ? country.population.toLocaleString()
            : "Not available";
    const area =
        country.area != null
            ? `${country.area.toLocaleString()} km²`
            : "Not available";
    const continent =
        country.continents?.join(", ") || "Not available";
    let callingCode = "Not available";
    if (country.idd?.root) {
        const suffix = country.idd.suffixes?.[0] || "";
        callingCode = `${country.idd.root}${suffix}`;
    }
    const drivingSide =
        country.car?.side || "Not available";
    const weekStarts =
        country.startOfWeek || "Not available";
    const timeZone =
        country.timezones?.[0] || "Not available";
    let currenciesHTML = "";
    if (country.currencies) {
        currenciesHTML = Object.entries(country.currencies)
            .map(([code, currency]) => {
                return `
                    <span class="extra-tag">
                        ${escapeHTML(currency.name)}
                        (${escapeHTML(code)}
                        ${escapeHTML(currency.symbol || "")})
                    </span>
                `;
            })
            .join("");
    }
    if (!currenciesHTML) {
        currenciesHTML = `
            <span class="extra-tag">Not available</span>
        `;
    }
    let languagesHTML = "";
    if (country.languages) {
        languagesHTML = Object.values(country.languages)
            .map(language => {
                return `
                    <span class="extra-tag">
                        ${escapeHTML(language)}
                    </span>
                `;
            })
            .join("");
    }
    if (!languagesHTML) {
        languagesHTML = `
            <span class="extra-tag">Not available</span>
        `;
    }
    let bordersHTML = "";
    if (country.borders && country.borders.length > 0) {
        bordersHTML = country.borders.map(border => {
            return `
                <span class="extra-tag border-tag">
                    ${escapeHTML(border)}
                </span>
            `;
        }).join("");
    } else {
        bordersHTML = `
            <span class="extra-tag">
                No neighboring countries
            </span>
        `;
    }
    const googleMaps =
        country.maps?.googleMaps || "#";
    countryInfoContainer.innerHTML = `
        <div class="dashboard-country-header">
            <img
                src="${escapeHTML(flag)}"
                alt="${escapeHTML(countryName)}"
                class="dashboard-country-flag"
            >
            <div class="dashboard-country-title">
                <h3>${escapeHTML(countryName)}</h3>
                <p class="official-name">
                    ${escapeHTML(officialName)}
                </p>
                <span class="region">
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHTML(region)}
                    ${subregion ? " • " + escapeHTML(subregion) : ""}
                </span>
            </div>
        </div>
        <div class="dashboard-local-time">
            <div class="local-time-display">
                <i class="fa-solid fa-clock"></i>
                <span class="local-time-value" id="country-local-time">
                    ${escapeHTML(getLocalTime(timeZone))}
                </span>
                <span class="local-time-zone">
                    ${escapeHTML(timeZone)}
                </span>
            </div>
        </div>
        <div class="dashboard-country-grid">
            <div class="dashboard-country-detail">
                <i class="fa-solid fa-building-columns"></i>
                <span class="label">Capital</span>
                <span class="value">${escapeHTML(capital)}</span>
            </div>
            <div class="dashboard-country-detail">
                <i class="fa-solid fa-users"></i>
                <span class="label">Population</span>
                <span class="value">${escapeHTML(population)}</span>
            </div>
            <div class="dashboard-country-detail">
                <i class="fa-solid fa-ruler-combined"></i>
                <span class="label">Area</span>
                <span class="value">${escapeHTML(area)}</span>
            </div>
            <div class="dashboard-country-detail">
                <i class="fa-solid fa-globe"></i>
                <span class="label">Continent</span>
                <span class="value">${escapeHTML(continent)}</span>
            </div>
            <div class="dashboard-country-detail">
                <i class="fa-solid fa-phone"></i>
                <span class="label">Calling Code</span>
                <span class="value">${escapeHTML(callingCode)}</span>
            </div>
            <div class="dashboard-country-detail">
                <i class="fa-solid fa-car"></i>
                <span class="label">Driving Side</span>
                <span class="value">${escapeHTML(drivingSide)}</span>
            </div>
            <div class="dashboard-country-detail">
                <i class="fa-solid fa-calendar-week"></i>
                <span class="label">Week Starts</span>
                <span class="value">${escapeHTML(weekStarts)}</span>
            </div>
        </div>
        <div class="dashboard-country-extras">
            <div class="dashboard-country-extra">
                <h4>
                    <i class="fa-solid fa-coins"></i>
                    Currency
                </h4>
                <div class="extra-tags">
                    ${currenciesHTML}
                </div>
            </div>
            <div class="dashboard-country-extra">
                <h4>
                    <i class="fa-solid fa-language"></i>
                    Languages
                </h4>
                <div class="extra-tags">
                    ${languagesHTML}
                </div>
            </div>
            <div class="dashboard-country-extra">
                <h4>
                    <i class="fa-solid fa-map-location-dot"></i>
                    Neighbors
                </h4>
                <div class="extra-tags">
                    ${bordersHTML}
                </div>
            </div>
        </div>
        <div class="dashboard-country-actions">
            <a
                href="${escapeHTML(googleMaps)}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-map-link"
            >
                <i class="fa-solid fa-map"></i>
                View on Google Maps
            </a>
        </div>
    `;
}
function getLocalTime(timeZone) {
    if (!timeZone || timeZone === "Not available") {
        return "Not available";
    }
    const match = timeZone.match(
        /^UTC([+-])(\d{2}):?(\d{2})?$/
    );
    if (!match) {
        return "Not available";
    }
    const sign = match[1] === "+" ? 1 : -1;
    const hours = Number(match[2]);
    const minutes = Number(match[3] || 0);
    const offset = sign * (hours * 60 + minutes);
    const now = new Date();
    const utcTime =
        now.getTime() + now.getTimezoneOffset() * 60000;
    const countryTime = new Date(
        utcTime + offset * 60000
    );
    return countryTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

}
function updateSelectedDestination(country) {
    const countryName =
        country.name?.common || "Unknown Country";
    const flag =
        country.flags?.png ||
        country.flags?.svg ||
        "";
    selectedCountryFlag.src = flag;
    selectedCountryFlag.alt = countryName;
    selectedCountryName.textContent = countryName;
    selectedCityName.textContent =
        appState.selectedCity
            ? `• ${appState.selectedCity}`
            : "";
    selectedDestination.style.display = "";
}
searchButton.addEventListener("click", async () => {
    const countryCode = countrySelect.value;
    appState.selectedCity = citySelect.value || "";
    appState.selectedYear = yearSelect.value;
    if (!countryCode) {
        showError();
        return;
    }
    await getCountryInfo(countryCode);
    getPublicHolidays(
        appState.selectedYear,
        countryCode
    );
    if (appState.selectedCity) {
        getTicketmasterEvents();

    }

});
clearButton.addEventListener("click", () => {
    countrySelect.value = "";
    citySelect.innerHTML = `
        <option value="">Select City</option>
    `;
    citySelect.disabled = false;
    yearSelect.value = "2026";
    appState.selectedCountry = "";
    appState.selectedCountryName = "";
    appState.selectedCity = "";
    appState.selectedYear = "2026";
    appState.countryData = null;
    citiesRequestId++;
    eventsRequestId++;
    selectedDestination.style.display = "none";
    countryInfoContainer.innerHTML = `
        <p class="empty-message">
            Select a country and click Explore
            to see its information.
        </p>
    `;
    if (holidaysGrid) {
        holidaysGrid.innerHTML = `
            <div class="empty-state">
                <p>Select a country to see public holidays.</p>
            </div>
        `;
    }
    showNoCitySelected();
});
function showError() {
    countryInfoContainer.innerHTML = `
        <div class="error-state"
            style="
                min-height: 350px;
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                gap: 20px;
            ">

            <div class="error-icon">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>

            <p style="
                margin: 0;
                text-align: center;
                max-width: 450px;
                line-height: 1.7;
            ">
                Failed to load country information.
                Please try again.
            </p>

        </div>

    `;
}
async function getPublicHolidays(year, countryCode) {
    if (!holidaysGrid) {
        console.error("Holidays container not found.");
        return;
    }
    if (!countryCode) {
        holidaysGrid.innerHTML = `
            <div class="error-state">
                <p>Please select a country first.</p>
            </div>
        `;
        return;
    }
    holidaysGrid.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading public holidays...</p>
        </div>
    `;
    try {
        const response = await fetch(
            `${HOLIDAYS_API}/${year}/${countryCode}`
        );
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        const holidays = await response.json();
        if (!holidays || holidays.length === 0) {
            holidaysGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <p>No public holidays found for this year.</p>
                </div>
            `;
            return;
        }
        displayPublicHolidays(holidays);
    } catch (error) {
        console.error("Public Holidays Error:", error);
        holidaysGrid.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Failed to load public holidays. Please try again.</p>
            </div>
        `;
    }
}
function displayPublicHolidays(holidays) {
    holidays.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    holidaysGrid.innerHTML = holidays.map(holiday => {
        const formattedDate = new Date(
            `${holiday.date}T00:00:00`
        ).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        const holidayTypes = holiday.types?.length
            ? holiday.types
            : ["Not specified"];
        return `
            <div class="holiday-card">
                <div class="holiday-date">
                    <i class="fa-regular fa-calendar"></i>
                    <span>
                        ${escapeHTML(formattedDate)}
                    </span>
                </div>
                <div class="holiday-info">
                    <h3>
                        ${escapeHTML(holiday.localName)}
                    </h3>
                    <p>
                        ${escapeHTML(holiday.name)}
                    </p>
                </div>
                <div class="holiday-details">
                    <span class="holiday-country">
                        <i class="fa-solid fa-earth-africa"></i>
                        ${escapeHTML(holiday.countryCode)}
                    </span>
                    <span class="holiday-status">
                        <i class="fa-solid fa-globe"></i>
                        ${holiday.global
                ? "National Holiday"
                : "Regional Holiday"
            }
                    </span>
                </div>
                <div class="holiday-types">
                    ${holidayTypes.map(type => `
                        <span class="holiday-type">
                            ${escapeHTML(type)}
                        </span>
                    `).join("")}
                </div>
                <div class="holiday-fixed">
                    <i class="fa-solid fa-repeat"></i>
                    ${holiday.fixed
                ? "Fixed Date"
                : "Variable Date"
            }
                </div>
            </div>
        `;
    }).join("");

}
function showNoCitySelected() {
    if (noCitySelected) {
        noCitySelected.hidden = false;
    }
    if (eventsContent) {
        eventsContent.hidden = true;
    }
}
if (goToDashboardBtn) {
    goToDashboardBtn.addEventListener("click", () => {
        const dashboardLink = document.querySelector(
            '[data-view="dashboard"]'
        );
        if (dashboardLink) {
            dashboardLink.click();
        }
    });

}
async function getTicketmasterEvents() {
    const countryCode = countrySelect.value;
    const city = citySelect.value;
    if (!countryCode || !city) {
        showNoCitySelected();
        return;
    }
    if (
        !TICKETMASTER_API_KEY ||
        TICKETMASTER_API_KEY === "YOUR_TICKETMASTER_API_KEY"
    ) {
        console.error("Please add your Ticketmaster API key.");
        eventsContent.innerHTML = `
            <div class="empty-state">
                <p>Please add your Ticketmaster API key.</p>
            </div>
        `;
        if (noCitySelected) {
            noCitySelected.hidden = true;
        }
        if (eventsContent) {
            eventsContent.hidden = false;
        }
        return;
    }
    const requestId = ++eventsRequestId;
    if (noCitySelected) {
        noCitySelected.hidden = true;
    }
    if (eventsContent) {
        eventsContent.hidden = false;
    }
    eventsContent.innerHTML = `
        <div class="loading-events">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading events...</p>
        </div>
    `;
    try {
        const params = new URLSearchParams({
            apikey: TICKETMASTER_API_KEY,
            city: city,
            countryCode: countryCode,
            size: "20",
            sort: "date,asc"
        });
        const response = await fetch(
            `${TICKETMASTER_API}?${params.toString()}`
        );
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        const data = await response.json();
        if (requestId !== eventsRequestId) {
            return;
        }
        const events = data._embedded?.events || [];
        if (events.length === 0) {
            eventsContent.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <h3>No Events Found</h3>
                    <p>
                        There are no events available
                        in ${escapeHTML(city)}.
                    </p>
                </div>
            `;
            return;
        }
        displayEvents(events);
    } catch (error) {
        console.error("Ticketmaster Events Error:", error);
        if (requestId !== eventsRequestId) {
            return;
        }
        eventsContent.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Unable to Load Events</h3>
                <p>
                    Please check your API key or try again later.
                </p>
            </div>
        `;
    }
}
function displayEvents(events) {
    eventsContent.innerHTML = events.map(event => {
        const eventImage =
            event.images?.find(image => image.ratio === "16_9")?.url ||
            event.images?.[0]?.url ||
            "";
        const eventName =
            event.name || "Untitled Event";
        const eventDate = event.dates?.start?.localDate;
        const eventTime = event.dates?.start?.localTime || "";
        let formattedDate = "Date not available";
        if (eventDate) {
            formattedDate = new Date(
                `${eventDate}T00:00:00`
            ).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        }
        const venue =
            event._embedded?.venues?.[0];
        const venueName =
            venue?.name || "Venue not available";
        const cityName =
            venue?.city?.name || "City not available";
        const category =
            event.classifications?.[0]?.segment?.name ||
            event.classifications?.[0]?.genre?.name ||
            "Event";
        const priceRange = event.priceRanges?.[0];
        let priceText = "Price not available";
        if (priceRange) {
            const currency = priceRange.currency || "";
            const minimum = priceRange.min;
            const maximum = priceRange.max;
            if (minimum != null && maximum != null) {
                priceText = `${minimum} - ${maximum} ${currency}`;
            } else if (minimum != null) {
                priceText = `From ${minimum} ${currency}`;
            }
        }
        const ticketURL = event.url || "#";
        return `
            <div class="event-card">
                <div class="event-card-image">
                    ${eventImage
                ? `
                                <img
                                    src="${escapeHTML(eventImage)}"
                                    alt="${escapeHTML(eventName)}"
                                    loading="lazy"
                                >
                            `
                : `
                                <div class="event-image-placeholder">
                                    <i class="fa-solid fa-ticket"></i>
                                </div>
                            `
            }
   <span class="event-category">
                        ${escapeHTML(category)}
                    </span>
                </div>
                <div class="event-card-body">
                    <h3>
                        ${escapeHTML(eventName)}
                    </h3>
                    <div class="event-card-info">
                        <p>
                            <i class="fa-regular fa-calendar"></i>
                            ${escapeHTML(formattedDate)}
                        </p>
                        <p>
                            <i class="fa-regular fa-clock"></i>
                            ${escapeHTML(eventTime || "Time not available")}
                        </p>
                        <p>
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapeHTML(venueName)}
                        </p>
                        <p>
                            <i class="fa-solid fa-city"></i>
                            ${escapeHTML(cityName)}
                        </p>
                        <p>
                            <i class="fa-solid fa-tag"></i>
                            ${escapeHTML(priceText)}
                        </p>
                    </div>
                    <div class="event-card-footer">
                        <a
                            href="${escapeHTML(ticketURL)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn-buy-ticket"
                            ${ticketURL === "#" ? "aria-disabled=\"true\"" : ""}
                        >
                            <i class="fa-solid fa-ticket"></i>
                            Get Tickets
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join("");

}
async function getCityCoordinates(city, countryCode) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to get city coordinates");
    }
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        throw new Error("City not found");
    }
    const matchedCity = data.results.find(
        item => item.country_code?.toUpperCase() === countryCode.toUpperCase()
    );
    if (!matchedCity) {
        throw new Error("City not found in selected country");
    }
    return matchedCity;
}
async function getWeatherForecast(city, country) {
    const weatherContent = document.getElementById("weather-content");
    if (!weatherContent) return;
    if (!city || !country) {
        weatherContent.innerHTML = "<p>Please select a city first.</p>";
        return;
    }
    weatherContent.innerHTML = "<p>Loading weather...</p>";
    try {
        const location = await getCityCoordinates(city, country);
        const latitude = location.latitude;
        const longitude = location.longitude;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to fetch weather data");
        }
        const weatherData = await response.json();
        displayWeather(weatherData, location.name);
    } catch (error) {
        console.error("Weather Error:", error);
        weatherContent.innerHTML = `
            <p class="error-message">
                Unable to load weather data. Please try again.
            </p>
        `;
    }
}
getCountries();
function getWeatherDescription(code) {
    const weatherCodes = {
        0: "Clear sky ☀️",
        1: "Mainly clear 🌤️",
        2: "Partly cloudy ⛅",
        3: "Overcast ☁️",
        45: "Fog 🌫️",
        48: "Fog 🌫️",
        51: "Light drizzle 🌦️",
        53: "Moderate drizzle 🌦️",
        55: "Heavy drizzle 🌧️",
        61: "Slight rain 🌧️",
        63: "Moderate rain 🌧️",
        65: "Heavy rain 🌧️",
        71: "Slight snow ❄️",
        73: "Moderate snow ❄️",
        75: "Heavy snow ❄️",
        80: "Rain showers 🌦️",
        81: "Moderate rain showers 🌧️",
        82: "Heavy rain showers ⛈️",
        95: "Thunderstorm ⛈️",
        96: "Thunderstorm with hail ⛈️",
        99: "Heavy thunderstorm ⛈️"
    };
    return weatherCodes[code] || "Unknown weather";
} 
function displayWeather(data, cityName) {
    const weatherContent = document.getElementById("weather-content");
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    function getWeatherIcon(code) {
        if (code === 0) return "fa-sun";
        if ([1, 2].includes(code)) return "fa-cloud-sun";
        if (code === 3) return "fa-cloud";
        if ([45, 48].includes(code)) return "fa-smog";
        if ([51, 53, 55, 56, 57].includes(code)) return "fa-cloud-rain";
        if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "fa-cloud-showers-heavy";
        if ([71, 73, 75, 77, 85, 86].includes(code)) return "fa-snowflake";
        if ([95, 96, 99].includes(code)) return "fa-cloud-bolt";
        return "fa-cloud-sun";
    }
    function getWeatherClass(code) {
        if (code === 0) return "weather-sunny";
        if ([1, 2, 3].includes(code)) return "weather-cloudy";
        if ([45, 48].includes(code)) return "weather-foggy";
        if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
            return "weather-rainy";
        if ([71, 73, 75, 77, 85, 86].includes(code))
            return "weather-snowy";
        if ([95, 96, 99].includes(code))
            return "weather-stormy";
        return "weather-default";
    }
    function getUVLevel(uv) {
        if (uv <= 2) return "low";
        if (uv <= 5) return "moderate";
        if (uv <= 7) return "high";
        if (uv <= 10) return "very-high";
        return "extreme";
    }
    function formatTime(time) {
        return time ? time.split("T")[1] : "--:--";
    }
    const weatherIcon = getWeatherIcon(current.weather_code);
    const weatherClass = getWeatherClass(current.weather_code);
    let hourlyHTML = "";
    for (let i = 0; i < Math.min(6, hourly.time.length); i++) {
        hourlyHTML += `
            <div class="hourly-item ${i === 0 ? "now" : ""}">
                <p class="hourly-time">
                    ${i === 0 ? "Now" : formatTime(hourly.time[i])}
                </p>
                <div class="hourly-icon">
                    <i class="fas ${getWeatherIcon(hourly.weather_code[i])}"></i>
                </div>
                <h3 class="hourly-temp">
                    ${hourly.temperature_2m[i]}°
                </h3>
                <p class="hourly-precip">
                    <i class="fas fa-tint"></i>
                    ${hourly.precipitation_probability[i]}%
                </p>
            </div>
        `;
    }
    let dailyHTML = "";
    for (let i = 0; i < Math.min(7, daily.time.length); i++) {
        const date = new Date(daily.time[i] + "T00:00:00");
        const dayName = i === 0
            ? "Today"
            : date.toLocaleDateString("en-US", { weekday: "short" });
        const dayDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });
        dailyHTML += `
            <div class="forecast-day ${i === 0 ? "today" : ""}">
                <div class="forecast-day-name">
                    <span class="day-label">${dayName}</span>
                    <span class="day-date">${dayDate}</span>
                </div>
                <div class="forecast-icon">
                    <i class="fas ${getWeatherIcon(daily.weather_code[i])}"></i>
                </div>
                <div class="forecast-temps">
                    <span class="temp-max">
                        ${daily.temperature_2m_max[i]}°
                    </span>
                    <span class="temp-min">
                        ${daily.temperature_2m_min[i]}°
                    </span>
                </div>
                <div class="forecast-precip">
                    <i class="fas fa-tint"></i>
                    ${daily.precipitation_probability_max[i]}%
                </div>

            </div>
        `;
    }
    const uv = current.uv_index ?? 0;
    const uvLevel = getUVLevel(uv);
    weatherContent.innerHTML = `
        <div class="weather-layout">
            <!-- Weather Hero Card -->
            <div class="weather-hero-card ${weatherClass}">
                <div class="weather-hero-bg"></div>
                <div class="weather-hero-content">
                    <div class="weather-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${escapeHTML(cityName)}
                        <div class="weather-time">
                            ${current.time.replace("T", " ")}
                        </div>
                    </div>
                    <div class="weather-hero-main">
                        <div class="weather-hero-left">
                            <div class="weather-hero-icon">
                                <i class="fas ${weatherIcon}"></i>
                            </div>
                            <div class="weather-hero-temp">
                                <span class="temp-value">
                                    ${current.temperature_2m}
                                </span>
                                <span class="temp-unit">°C</span>
                            </div>
                        </div>
                        <div class="weather-hero-right">
                            <h2 class="weather-condition">
                                ${getWeatherDescription(current.weather_code)}
                            </h2>
                            <p class="weather-feels">
                                Feels like ${current.apparent_temperature}°C
                            </p>
                            <div class="weather-high-low">
                                <span class="high">
                                    <i class="fas fa-arrow-up"></i>
                                    ${daily.temperature_2m_max[0]}°
                                </span>
                                <span class="low">
                                    <i class="fas fa-arrow-down"></i>
                                    ${daily.temperature_2m_min[0]}°
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Weather Details -->
            <div class="weather-details-grid">
                <div class="weather-detail-card">
                    <div class="detail-icon humidity">
                        <i class="fas fa-tint"></i>
                    </div>
                    <div class="detail-info">
                        <p class="detail-label">Humidity</p>
                        <h3 class="detail-value">
                            ${current.relative_humidity_2m}%
                        </h3>
                    </div>
                </div>
                <div class="weather-detail-card">
                    <div class="detail-icon wind">
                        <i class="fas fa-wind"></i>
                    </div>
                    <div class="detail-info">
                        <p class="detail-label">Wind Speed</p>
                        <h3 class="detail-value">
                            ${current.wind_speed_10m} km/h
                        </h3>
                    </div>
                </div>
                <div class="weather-detail-card">
                    <div class="detail-icon precip">
                        <i class="fas fa-compass"></i>
                    </div>
                    <div class="detail-info">
                        <p class="detail-label">Wind Direction</p>
                        <h3 class="detail-value">
                            ${current.wind_direction_10m}°
                        </h3>
                    </div>
                </div>
                <div class="weather-detail-card">
                    <div class="detail-icon uv">
                        <i class="fas fa-sun"></i>
                    </div>
                    <div class="detail-info">
                        <p class="detail-label">UV Index</p>
                        <h3 class="detail-value">
                            ${uv}
                        </h3>
                        <span class="uv-level ${uvLevel}">
                            ${uvLevel}
                        </span>
                    </div>
                </div>
                <div class="weather-detail-card sunrise-sunset">
                    <div class="detail-info">
                        <p class="detail-label">Sunrise & Sunset</p>
                    </div>
                    <div class="sun-times-visual">
                        <div class="sun-time sunrise">
                            <i class="fas fa-sun"></i>
                            <span class="sun-label">Sunrise</span>
                            <span class="sun-value">
                                ${formatTime(daily.sunrise[0])}
                            </span>
                        </div>
                        <div class="sun-arc">
                            <div class="sun-arc-path"></div>
                            <div class="sun-position"
                                style="--sun-progress: 50%">
                            </div>
                        </div>
                        <div class="sun-time sunset">
                            <i class="fas fa-moon"></i>
                            <span class="sun-label">Sunset</span>
                            <span class="sun-value">
                                ${formatTime(daily.sunset[0])}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Hourly Forecast -->
            <div class="weather-section">
                <h2 class="weather-section-title">
                    <i class="fas fa-clock"></i>
                    Hourly Forecast
                </h2>
                <div class="hourly-scroll">
                    ${hourlyHTML}
                </div>
            </div>
            <!-- 7-Day Forecast -->
            <div class="weather-section">
                <h2 class="weather-section-title">
                    <i class="fas fa-calendar-week"></i>
                    7-Day Forecast
                </h2>
                <div class="forecast-list">
                    ${dailyHTML}
                </div>
            </div>
        </div>
    `;
}
  function updateSunTimesSelection() {
    const sunCityName = document.getElementById("sun-city-name");
    const sunCountryName = document.getElementById("sun-country-name");

    if (sunCityName) {
        sunCityName.textContent = appState.selectedCity || "Select a city";
    }

    if (sunCountryName) {
        sunCountryName.textContent = appState.selectedCountryName || "Select a country";
    }
}
 
