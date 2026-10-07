const SUPABASE_URL = "https://sdgjmpgiqmjlhkmazwfr.supabase.co";
const SUPABASE_KEY = "sb_publishable_b__dR4LyPZReGNwK1tyyqQ_BkeelgJ4";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let allStamps = [];
let editingStampId = null;


/* ==============================
   LOAD STAMPS
============================== */

async function loadStamps() {

    const { data, error } = await supabaseClient
        .from("Stamps")
        .select("*")
        .order("collection_date", { ascending: false });

    if (error) {

        console.error("Supabase error:", error);

        document.getElementById("gallery").innerHTML = `
            <div class="empty">
                <h2>Unable to load collection</h2>
                <p>${error.message}</p>
            </div>
        `;

        return;
    }

    allStamps = data || [];

    displayStamps(allStamps);
}

/* ==============================
   FILTER + SORT
============================== */

function filterStamps() {

    const searchText =
        document.getElementById("searchInput")
            .value
            .toLowerCase()
            .trim();

    const category =
        document.getElementById("categoryFilter").value
            .trim()
            .toLowerCase();

    const favoriteFilter =
        document.getElementById("favoriteFilter").value;

    const sortFilter =
        document.getElementById("sortFilter").value;


    let filtered = allStamps.filter(stamp => {

        /* ==============================
           SEARCH
        ============================== */

        const matchesSearch =
            !searchText ||
            (stamp.name || "")
                .toLowerCase()
                .includes(searchText) ||

            (stamp.description || "")
                .toLowerCase()
                .includes(searchText) ||

            (stamp.location || "")
                .toLowerCase()
                .includes(searchText);


        /* ==============================
           CATEGORY
        ============================== */

        const stampCategories =
            Array.isArray(stamp.category)
                ? stamp.category
                : typeof stamp.category === "string"
                    ? [stamp.category]
                    : [];


        const normalizedStampCategories =
            stampCategories
                .map(categoryName =>
                    String(categoryName || "")
                        .trim()
                        .toLowerCase()
                )
                .filter(Boolean);


        const matchesCategory =
            category === "all" ||
            normalizedStampCategories.includes(category);


        /* ==============================
           FAVORITE
        ============================== */

        let matchesFavorite = true;

        if (favoriteFilter === "favorite") {
            matchesFavorite =
                stamp.favorite === true;
        }

        if (favoriteFilter === "not-favorite") {
            matchesFavorite =
                stamp.favorite !== true;
        }


        /* ==============================
           FINAL MATCH
        ============================== */

        return (
            matchesSearch &&
            matchesCategory &&
            matchesFavorite
        );

    });


    /* ==============================
       SORT
    ============================== */

    filtered.sort((a, b) => {

        switch (sortFilter) {

            case "newest":
                return (
                    new Date(b.collection_date || 0) -
                    new Date(a.collection_date || 0)
                );

            case "oldest":
                return (
                    new Date(a.collection_date || 0) -
                    new Date(b.collection_date || 0)
                );

            case "name-asc":
                return (a.name || "")
                    .localeCompare(b.name || "");

            case "name-desc":
                return (b.name || "")
                    .localeCompare(a.name || "");

            case "price-low":
                return (a.price ?? 0) -
                       (b.price ?? 0);

            case "price-high":
                return (b.price ?? 0) -
                       (a.price ?? 0);

            default:
                return 0;
        }

    });


    displayStamps(filtered);
}

/* ==============================
   FILTER FROM COLLECTION OVERVIEW
============================== */

function filterByOverviewCategory(category) {

    const categoryFilter =
        document.getElementById("categoryFilter");

    if (!categoryFilter) {
        return;
    }

    const cleanCategory =
        String(category || "").trim();

    const matchingOption =
        Array.from(categoryFilter.options)
            .find(option =>
                option.value.trim().toLowerCase() ===
                cleanCategory.toLowerCase()
            );

    if (matchingOption) {

        categoryFilter.value =
            matchingOption.value;

    } else {

        categoryFilter.value =
            cleanCategory;
    }

    filterStamps();
}

/* ==============================
   DISPLAY STAMPS
============================== */

function displayStamps(items) {

    const gallery = document.getElementById("gallery");

    updateCollectionOverview();

    if (!items || items.length === 0) {

    const hasCollection =
        allStamps && allStamps.length > 0;

    gallery.innerHTML = hasCollection
        ? `
            <div class="empty">
                <h2>No matching stamps</h2>
                <p>
                    Try changing your search or filters.
                </p>
            </div>
          `
        : `
            <div class="empty">
                <h2>No stamps yet</h2>
                <p>
                    Click "+ Add Stamp" to add your first stamp.
                </p>
            </div>
          `;

    return;
}


    gallery.innerHTML = items.map(stamp => {

        const imageUrls =
    Array.isArray(stamp.image_urls) &&
    stamp.image_urls.length > 0
        ? stamp.image_urls
        : stamp.image_url
            ? [stamp.image_url]
            : [];


const image =
    imageUrls.length > 0

        ? `
            <img
                id="main-image-${stamp.id}"
                src="${imageUrls[0]}"
                alt="${stamp.name || "Stamp"}"
            >

            ${
                imageUrls.length > 1
                    ? `
                        <div class="image-thumbnails">

                            ${imageUrls.map((imageUrl, index) => `

                                <img
                                    src="${imageUrl}"
                                    class="
                                        image-thumbnail
                                        ${index === 0 ? "active" : ""}
                                    "
                                    alt="${stamp.name || "Stamp"} photo ${index + 1}"
                                    onclick="
                                        event.stopPropagation();
                                        changeMainImage(
                                            ${stamp.id},
                                            '${imageUrl.replace(/'/g, "\\'")}',
                                            this
                                        );
                                    "
                                >

                            `).join("")}

                        </div>
                      `
                    : ""
            }

          `

        : `
            <div class="no-image">
                No Image
            </div>
          `;


        const favoriteIcon =
            stamp.favorite ? "♥" : "♡";


        const price =
            stamp.price !== null &&
            stamp.price !== undefined
                ? `RM ${Number(stamp.price).toFixed(2)}`
                : "";


        /* Categories */

        const categories =
            Array.isArray(stamp.category)
                ? stamp.category.filter(
                    category =>
                        typeof category === "string" &&
                        category.trim() !== ""
                )
                : typeof stamp.category === "string" &&
                  stamp.category.trim() !== ""
                    ? [stamp.category]
                    : [];


        const categoryBadges =
    categories.length
        ? `
            <div class="card-categories">

                ${categories.map(category => {

                    const colors =
                        getCategoryColors(category);

                    return `
                        <span
                            class="category-badge"
                            style="
                                background: ${colors.background};
                                color: ${colors.color};
                            "
                        >
                            ${category}
                        </span>
                    `;

                }).join("")}

            </div>
          `
        : "";


        return `

            <div class="card">

                <!-- IMAGE -->

           <div
             class="card-image"
             onclick="handleStampImageClick(event, ${stamp.id})"
           >
          ${image}
           </div>


                <!-- CONTENT -->

                <div class="card-content">


                    <!-- FAVORITE -->

                    <button
                        class="favorite-button ${
                            stamp.favorite ? "active" : ""
                        }"
                        onclick="toggleFavorite(${stamp.id})"
                        title="Toggle favorite"
                        aria-label="Toggle favorite"
                    >
                        ${favoriteIcon}
                    </button>


                    <!-- TITLE -->

                    <div class="card-title">
                        ${stamp.name || "Unnamed Stamp"}
                    </div>


                    <!-- CATEGORIES -->

                    ${categoryBadges}


                    <!-- DESCRIPTION -->

                    <div class="card-description">
                        ${stamp.description || ""}
                    </div>


                    <!-- INFORMATION -->

                    <div class="card-info">

                        ${
                            stamp.location
                                ? `
                                    <div class="info-row">
                                        <span class="info-icon">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M12 21s7-6.1 7-12A7 7 0 0 0 5 9c0 5.9 7 12 7 12Z"></path>
                                                <circle
                                                    cx="12"
                                                    cy="9"
                                                    r="2.5"
                                                ></circle>
                                            </svg>
                                        </span>

                                        <span>
                                            ${stamp.location}
                                        </span>
                                    </div>
                                `
                                : ""
                        }


                        ${
                            stamp.collection_date
                                ? `
                                    <div class="info-row">
                                        <span class="info-icon">
                                            <svg viewBox="0 0 24 24">
                                                <rect
                                                    x="3"
                                                    y="5"
                                                    width="18"
                                                    height="16"
                                                    rx="2"
                                                ></rect>

                                                <line
                                                    x1="7"
                                                    y1="3"
                                                    x2="7"
                                                    y2="7"
                                                ></line>

                                                <line
                                                    x1="17"
                                                    y1="3"
                                                    x2="17"
                                                    y2="7"
                                                ></line>

                                                <line
                                                    x1="3"
                                                    y1="9"
                                                    x2="21"
                                                    y2="9"
                                                ></line>
                                            </svg>
                                        </span>

                                        <span>
                                            ${formatDate(
                                                stamp.collection_date
                                            )}
                                        </span>
                                    </div>
                                `
                                : ""
                        }


                        ${
                            price
                                ? `
                                    <div class="info-row price-row">
                                        <span class="info-icon">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M20 13 13 20H6a2 2 0 0 1-2-2v-7l7-7h7a2 2 0 0 1 2 2v7Z"></path>
                                                <circle
                                                    cx="15.5"
                                                    cy="8.5"
                                                    r="1.5"
                                                ></circle>
                                            </svg>
                                        </span>

                                        <span>
                                            ${price}
                                        </span>
                                    </div>
                                `
                                : ""
                        }

                    </div>


                    <!-- ACTIONS -->

                    <div class="card-actions">

                        <button
                            class="edit-button"
                            onclick="editStamp(${stamp.id})"
                        >
                            ✏️ Edit
                        </button>


                        <button
                            class="delete-button"
                            onclick="deleteStamp(${stamp.id})"
                        >
                            🗑️ Delete
                        </button>

                    </div>

                </div>

            </div>

        `;

    }).join("");
}

/* ==============================
   COLLECTION OVERVIEW
============================== */

function getCategoryColors(category) {

    const normalized =
        category
            .trim()
            .toLowerCase();

    /* Existing category colors */
    const fixedColors = {

        stamps: {
            background: "#E8E4DC",
            color: "#665F55"
        },

        lego: {
            background: "#f5dfdf",
            color: "#a34d4d"
        },

        pokemon: {
            background: "#fff3c4",
            color: "#8a6d1d"
        },

        "pokémon": {
            background: "#fff3c4",
            color: "#8a6d1d"
        },

        others: {
            background: "#dcecf7",
            color: "#52758c"
        }

    };


    if (fixedColors[normalized]) {
        return fixedColors[normalized];
    }


    /* Colors for new categories */
    const newCategoryColors = [

        {
            background: "#eadff2",
            color: "#76558a"
        },

        {
            background: "#dfeee3",
            color: "#55755d"
        },

        {
            background: "#f3e1cf",
            color: "#916844"
        },

        {
            background: "#dce8f4",
            color: "#55728f"
        },

        {
            background: "#f1dfeb",
            color: "#875b78"
        },

        {
            background: "#e3e1f1",
            color: "#625f8a"
        },

        {
            background: "#e8ecd9",
            color: "#697348"
        },

        {
            background: "#f1e4d8",
            color: "#87654c"
        }

    ];


    /*
       Generate a consistent number
       from the category name.
    */

    let hash = 0;

    for (let i = 0; i < normalized.length; i++) {

        hash =
            ((hash << 5) - hash) +
            normalized.charCodeAt(i);

        hash |= 0;
    }


    const index =
        Math.abs(hash) %
        newCategoryColors.length;


    return newCategoryColors[index];
}

/* ==============================
   COLLECTION OVERVIEW
============================== */

function updateCollectionOverview() {

    const collectionCount =
        document.getElementById("collectionCount");

    const categoryStats =
        document.getElementById("categoryStats");


    /* ==============================
       COLLECTION COUNT
    ============================== */

    if (collectionCount) {

        const favoriteCount =
            allStamps.filter(
                stamp => stamp.favorite === true
            ).length;

        collectionCount.textContent =
            `${allStamps.length} ${
                allStamps.length === 1
                    ? "stamp"
                    : "stamps"
            } · ${favoriteCount} ${
                favoriteCount === 1
                    ? "favorite"
                    : "favorites"
            }`;
    }


    if (!categoryStats) {
        return;
    }


    /* ==============================
       COUNT CATEGORIES
    ============================== */

    const categoryCounts = {};


    allStamps.forEach(stamp => {

        const categories =
            Array.isArray(stamp.category)
                ? stamp.category
                : typeof stamp.category === "string"
                    ? [stamp.category]
                    : [];


        categories.forEach(category => {

            const cleanCategory =
                typeof category === "string"
                    ? category.trim()
                    : "";


            if (!cleanCategory) {
                return;
            }


            if (!categoryCounts[cleanCategory]) {
                categoryCounts[cleanCategory] = 0;
            }


            categoryCounts[cleanCategory]++;
        });

    });


    /* ==============================
       SORT CATEGORIES
    ============================== */

    const sortedCategories =
        Object.entries(categoryCounts)
            .sort(
                ([a], [b]) =>
                    a.localeCompare(b)
            );


    /* ==============================
       DISPLAY CATEGORY BADGES
    ============================== */

    categoryStats.innerHTML =
        sortedCategories
            .map(([category, count], index) => {

                const colors =
                    getCategoryColors(category);


                const categoryFilter =
    document.getElementById("categoryFilter");

const activeCategory =
    categoryFilter
        ? categoryFilter.value
        : "all";

const isActive =
    activeCategory !== "all" &&
    activeCategory === category;


return `
    <span
    class="
        category-stat
        category-stat-clickable
        ${isActive ? "active" : ""}
    "
    data-category-index="${index}"
    role="button"
    tabindex="0"

        style="
            background: ${colors.background};
            color: ${colors.color};
        "
        title="Filter by ${category}"
    >
                        ${category}

                        <span class="category-stat-count">
                            ${count}
                        </span>
                    </span>
                `;

            })
            .join("");


    /* ==============================
       CATEGORY CLICK EVENTS
    ============================== */

    const categoryBadges =
        categoryStats.querySelectorAll(
            ".category-stat-clickable"
        );


    categoryBadges.forEach(badge => {

        const index =
            Number(
                badge.dataset.categoryIndex
            );


        const category =
            sortedCategories[index]?.[0];


        badge.addEventListener(
    "click",
    () => {

        if (!category) {
            return;
        }

        filterByOverviewCategory(
            category
        );

    }
);


badge.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key !== "Enter" &&
            event.key !== " "
        ) {
            return;
        }

        event.preventDefault();

        if (!category) {
            return;
        }

        filterByOverviewCategory(
            category
        );

    }
);

    });

}

/* ==============================
   DATE
============================== */

function formatDate(date) {

    const d = new Date(date);

    const day =
        String(d.getDate()).padStart(2, "0");

    const month =
        String(d.getMonth() + 1).padStart(2, "0");

    const year =
        d.getFullYear();

    return `${day}/${month}/${year}`;
}


/* ==============================
   IMAGE PREVIEW
============================== */

const stampImageInput =
    document.getElementById("stampImage");

stampImageInput.addEventListener("change", () => {

    const files =
        Array.from(stampImageInput.files);

    // Remove previous preview
    const oldPreview =
        document.getElementById("imagePreviewContainer");

    if (oldPreview) {
        oldPreview.remove();
    }

    if (files.length === 0) {
        return;
    }

    // Create preview container
    const previewContainer =
        document.createElement("div");

    previewContainer.id =
        "imagePreviewContainer";

    previewContainer.className =
        "image-preview-container";

    files.forEach(file => {

        const reader =
            new FileReader();

        reader.onload = function(event) {

            const preview =
                document.createElement("img");

            preview.className =
                "image-preview";

            preview.src =
                event.target.result;

            preview.alt =
                "Selected image";

            previewContainer.appendChild(
                preview
            );
        };

        reader.readAsDataURL(file);
    });

    stampImageInput.parentElement.appendChild(
        previewContainer
    );
});


/* ==============================
   FORM ELEMENTS
============================== */

const addStampButton =
    document.getElementById("addStampButton");

const addForm =
    document.getElementById("addForm");

const stampForm =
    document.getElementById("stampForm");

const cancelButton =
    document.getElementById("cancelButton");

const editCloseButton =
    document.getElementById("editCloseButton");


/* ==============================
   CATEGORY MANAGER
============================== */

let availableCategories = [];


async function loadCategories() {

    const { data, error } =
        await supabaseClient
            .from("Categories")
            .select("id, name")
            .order("name", { ascending: true });

    if (error) {

        console.error(
            "Unable to load categories:",
            error
        );

        return;
    }

    availableCategories =
        (data || []).map(category => ({
            id: category.id,
            name: category.name.trim()
        }));


    console.log(
        "Categories loaded from Supabase:",
        availableCategories
    );

    renderCategoryCheckboxes();
    renderCategoryFilter();

}

document
    .getElementById("manageCategoriesButton")
    .addEventListener("click", () => {

        const container =
            document.getElementById("categoryOptions");

        if (!container) {
            return;
        }

        const isManaging =
            container.dataset.manageMode === "true";

        container.dataset.manageMode =
            isManaging ? "false" : "true";

        renderCategoryCheckboxes();
    });

/* ==============================
   EDIT CATEGORY
============================== */

async function editCategory(categoryId) {

    const category =
        availableCategories.find(
            item => item.id === categoryId
        );

    if (!category) {
        alert("Category not found.");
        return;
    }

    const oldName =
        String(category.name || "").trim();

    const newName =
        prompt(
            "Enter the new category name:",
            oldName
        );

    if (newName === null) {
        return;
    }

    const cleanName =
        newName.trim();

    if (!cleanName) {
        alert("Category name cannot be empty.");
        return;
    }

    if (
        cleanName.toLowerCase() ===
        oldName.toLowerCase()
    ) {
        return;
    }


    /* ==============================
       CHECK DUPLICATE CATEGORY
    ============================== */

    const alreadyExists =
        availableCategories.some(item =>
            item.id !== categoryId &&
            String(item.name || "")
                .trim()
                .toLowerCase() ===
            cleanName.toLowerCase()
        );

    if (alreadyExists) {
        alert("This category already exists.");
        return;
    }

/* ==============================
   UPDATE CATEGORIES TABLE
============================== */

const { data: updatedCategories, error: categoryError } =
    await supabaseClient
        .from("Categories")
        .update({
            name: cleanName
        })
        .eq("id", categoryId)
        .select();


if (categoryError) {

    console.error(
        "Unable to rename category:",
        categoryError
    );

    alert(
        "Unable to rename category: " +
        categoryError.message
    );

    return;
}


console.log(
    "CATEGORY UPDATE RESULT:",
    updatedCategories
);


/* ==============================
   CHECK WHETHER CATEGORY WAS UPDATED
============================== */

if (
    !updatedCategories ||
    updatedCategories.length === 0
) {

    console.error(
        "No category row was updated.",
        {
            categoryId: categoryId,
            oldName: oldName,
            newName: cleanName
        }
    );

    alert(
        "The category could not be updated.\n\n" +
        "No matching category row was found in Supabase."
    );

    return;
}


console.log(
    "CATEGORY UPDATED SUCCESSFULLY:",
    updatedCategories[0]
);
    


    /* ==============================
       GET ALL STAMPS DIRECTLY
    ============================== */

    const { data: stamps, error: stampsLoadError } =
        await supabaseClient
            .from("Stamps")
            .select("id, category");

        console.log("STAMPS FROM SUPABASE BEFORE CATEGORY UPDATE:", stamps);
        console.log("OLD CATEGORY:", oldName);
        console.log("NEW CATEGORY:", cleanName);


    if (stampsLoadError) {

        console.error(
            "Unable to load stamps:",
            stampsLoadError
        );

        alert(
            "Category was renamed, but stamps could not be checked: " +
            stampsLoadError.message
        );

        await loadCategories();

        return;
    }


    /* ==============================
       UPDATE STAMPS USING OLD NAME
    ============================== */

    let updatedStampCount = 0;

    for (const stamp of stamps || []) {

        const categories =
            Array.isArray(stamp.category)
                ? stamp.category
                : typeof stamp.category === "string"
                    ? [stamp.category]
                    : [];


        const hasOldCategory =
            categories.some(categoryName =>
                String(categoryName || "")
                    .trim()
                    .toLowerCase() ===
                oldName.toLowerCase()
            );


        if (!hasOldCategory) {
            continue;
        }


        const updatedCategories =
            categories.map(categoryName => {

                const currentName =
                    String(categoryName || "").trim();

                if (
                    currentName.toLowerCase() ===
                    oldName.toLowerCase()
                ) {
                    return cleanName;
                }

                return currentName;
            });


        const { error: stampError } =
            await supabaseClient
                .from("Stamps")
                .update({
                    category: updatedCategories
                })
                .eq("id", stamp.id);


        if (stampError) {

            console.error(
                "Unable to update stamp category:",
                stampError
            );

            alert(
                `Category was renamed, but stamp "${stamp.id}" could not be updated: ` +
                stampError.message
            );

            return;
        }


        updatedStampCount++;

        console.log(
         "STAMP CATEGORY UPDATED:",
         stamp.id,
         updatedCategories);
    }


    /* ==============================
       REFRESH EVERYTHING
    ============================== */

    await loadCategories();

    await loadStamps();


    alert(
        `Category "${oldName}" has been renamed to "${cleanName}".\n\n` +
        `${updatedStampCount} stamp(s) updated.`
    );
}
    
function renderCategoryCheckboxes(selectedCategories = null) {

    const container =
        document.getElementById("categoryOptions");

    if (!container) {
        return;
    }

    /*
       If no selected categories were supplied,
       preserve the currently checked categories.
    */
    if (selectedCategories === null) {

        selectedCategories =
            Array.from(
                document.querySelectorAll(
                    'input[name="stampCategory"]:checked'
                )
            ).map(
                checkbox => checkbox.value
            );
    }

    const manageMode =
        container.dataset.manageMode === "true";

    container.innerHTML =
        availableCategories.map(category => {

            const checked =
                selectedCategories.includes(category.name)
                    ? "checked"
                    : "";

            return `
                <label>

                    <input
                        type="checkbox"
                        name="stampCategory"
                        value="${category.name}"
                        ${checked}
                    >

                    <span>
                        ${category.name}
                    </span>

                    ${
                        manageMode
                            ? `
                                <span class="category-manage-actions">

                                    <button
                                        type="button"
                                        class="category-manage-button edit-category-button"
                                        title="Edit category"
                                        onclick="
                                            event.preventDefault();
                                            event.stopPropagation();
                                            editCategory(${category.id});
                                        "
                                    >
                                        ✏️
                                    </button>

                                    <button
                                        type="button"
                                        class="category-manage-button delete-category-button"
                                        title="Delete category"
                                        onclick="
                                            event.preventDefault();
                                            event.stopPropagation();
                                            deleteCategory(${category.id});
                                        "
                                    >
                                        🗑️
                                    </button>

                                </span>
                              `
                            : ""
                    }

                </label>
            `;

        }).join("");
}

function renderCategoryFilter() {

    const filter =
        document.getElementById("categoryFilter");

    if (!filter) {
        return;
    }


    /*
       Remember current selection
    */

    const currentValue =
        filter.value;


    /*
       Clear existing options
    */

    filter.innerHTML = "";


    /*
       Add All Categories
    */

    const allOption =
        document.createElement("option");

    allOption.value = "all";
    allOption.textContent =
        "▦ All Categories";

    filter.appendChild(allOption);


    /*
       Add categories directly from
       the latest Categories table data
    */

    availableCategories.forEach(category => {

        const option =
            document.createElement("option");

        option.value =
            category.name;

        option.textContent =
            category.name;

        filter.appendChild(option);
    });


    /*
       Restore previous selection
       if the category still exists
    */

    const stillExists =
        Array.from(filter.options)
            .some(
                option =>
                    option.value === currentValue
            );


    if (
        currentValue &&
        currentValue !== "all" &&
        stillExists
    ) {
        filter.value =
            currentValue;
    }
    else {
        filter.value =
            "all";
    }


    console.log(
        "Category filter updated:",
        availableCategories.map(
            category => category.name
        )
    );
}

document
    .getElementById("addCategoryButton")
    .addEventListener("click", () => {

        const box =
            document.getElementById(
                "newCategoryBox"
            );

        const input =
            document.getElementById(
                "newCategoryInput"
            );

        box.style.display = "flex";

        input.focus();
    });


document
    .getElementById("saveCategoryButton")
    .addEventListener("click", addNewCategory);


document
    .getElementById("newCategoryInput")
    .addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();

            addNewCategory();
        }
    });


async function addNewCategory() {

    const input =
        document.getElementById("newCategoryInput");

    const name =
        input.value.trim();

    if (!name) {

        alert("Please enter a category name.");

        input.focus();

        return;
    }


    // Check if category already exists
    const alreadyExists =
        availableCategories.some(
            category =>
                category.name.toLowerCase() ===
                name.toLowerCase()
        );

    if (alreadyExists) {

        alert("This category already exists.");

        input.focus();

        return;
    }


    // Remember currently selected categories
    const selectedCategories =
        Array.from(
            document.querySelectorAll(
                'input[name="stampCategory"]:checked'
            )
        ).map(
            checkbox => checkbox.value
        );


    // Add new category to Supabase
    const { data, error } =
        await supabaseClient
            .from("Categories")
            .insert([
                {
                    name: name
                }
            ])
            .select()
            .single();


    if (error) {

        console.error(
            "Unable to add category:",
            error
        );

        alert(
            "Unable to add category: " +
            error.message
        );

        return;
    }


    // Add new category to local list
    availableCategories.push(data);

    availableCategories.sort(
        (a, b) =>
            a.name.localeCompare(b.name)
    );


    // Keep existing selections
    selectedCategories.push(name);


    // Rebuild checkboxes
    renderCategoryCheckboxes(
        selectedCategories
    );


    // Clear and hide new category box
    input.value = "";

    document.getElementById(
        "newCategoryBox"
    ).style.display = "none";


    // Update the main category filter
    renderCategoryFilter();
}

/* ==============================
   RESET FORM
============================== */

function resetStampForm() {

    editingStampId = null;

    stampForm.reset();

    addForm.classList.remove("editing-mode");

    addForm.style.display = "none";

    addStampButton.style.display = "block";

    document.body.classList.remove(
        "editing-popup-open"
    );


    const formTitle =
        document.querySelector("#addForm h2");

    if (formTitle) {
        formTitle.textContent =
            "Add New Stamp";
    }


    const submitButton =
        stampForm.querySelector(
            'button[type="submit"]'
        );

    if (submitButton) {
        submitButton.textContent =
            "Save Stamp";
    }


    const previewContainer =
    document.getElementById("imagePreviewContainer");

if (previewContainer) {
    previewContainer.remove();
}
}

/* ==============================
   CLOSE ADD / EDIT POPUP WHEN
   CLICKING OUTSIDE
============================== */

document.addEventListener("click", (event) => {

    const addForm =
        document.getElementById("addForm");

    const addStampButton =
        document.getElementById("addStampButton");

    // Popup is not open
    if (
        !addForm ||
        addForm.style.display === "none"
    ) {
        return;
    }

    // Click inside popup
    if (addForm.contains(event.target)) {
        return;
    }

    // Click Add Stamp button
    if (
        addStampButton &&
        addStampButton.contains(event.target)
    ) {
        return;
    }

    // Click Edit button
    // Let editStamp() handle opening the popup
    if (event.target.closest(".edit-button")) {
        return;
    }

    // Click Delete button
    // Let deleteStamp() handle the action
    if (event.target.closest(".delete-button")) {
        return;
    }

    // Anything else outside → close popup
    resetStampForm();
});

/* ==============================
   ADD STAMP
============================== */


addStampButton.addEventListener("click", () => {

    editingStampId = null;

    stampForm.reset();


    const formTitle =
        document.querySelector("#addForm h2");

    if (formTitle) {
        formTitle.textContent =
            "Add New Stamp";
    }


    const submitButton =
        stampForm.querySelector(
            'button[type="submit"]'
        );

    if (submitButton) {
        submitButton.textContent =
            "Save Stamp";
    }


    const previewContainer =
    document.getElementById("imagePreviewContainer");

if (previewContainer) {
    previewContainer.remove();
}


    /* Open popup */

    addForm.classList.add(
        "editing-mode"
    );

    addForm.style.display =
        "block";

    addStampButton.style.display =
        "none";


    /* Prevent background scrolling */

    document.body.classList.add(
        "editing-popup-open"
    );
});

/* ==============================
   CANCEL
============================== */
editCloseButton.addEventListener(
    "click",
    () => {
        resetStampForm();
    }
);

cancelButton.addEventListener("click", () => {

    resetStampForm();
});


/* ==============================
   SAVE / UPDATE STAMP
============================== */

stampForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const stampImageInput =
    document.getElementById("stampImage");

const imageFiles =
    Array.from(stampImageInput.files || []);

console.log(
    "Selected image files:",
    imageFiles
);

let imageUrls = [];


/* ==============================
   KEEP EXISTING IMAGES
============================== */

if (editingStampId !== null) {

    const existingStamp =
        allStamps.find(
            item => item.id === editingStampId
        );

    if (existingStamp) {

        if (
            Array.isArray(existingStamp.image_urls) &&
            existingStamp.image_urls.length > 0
        ) {

            imageUrls = [
                ...existingStamp.image_urls
            ];

        } else if (
            existingStamp.image_url
        ) {

            imageUrls = [
                existingStamp.image_url
            ];
        }
    }
}


/* ==============================
   UPLOAD NEW IMAGES
============================== */

for (const imageFile of imageFiles) {

    console.log(
        "Uploading image:",
        imageFile.name
    );

    const fileExtension =
        imageFile.name
            .split(".")
            .pop()
            .toLowerCase();

    const fileName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExtension}`;

    const filePath =
        `stamps/${fileName}`;


    const {
        data: uploadData,
        error: uploadError
    } =
        await supabaseClient.storage
            .from("stamps")
            .upload(
                filePath,
                imageFile
            );


    if (uploadError) {

        console.error(
            "IMAGE UPLOAD ERROR:",
            uploadError
        );

        alert(
            "Unable to upload image:\n\n" +
            uploadError.message
        );

        return;
    }


    console.log(
        "Image uploaded successfully:",
        uploadData
    );


    const {
        data: publicUrlData
    } =
        supabaseClient.storage
            .from("stamps")
            .getPublicUrl(filePath);


    if (
        !publicUrlData ||
        !publicUrlData.publicUrl
    ) {

        alert(
            "Image uploaded, but the public image URL could not be created."
        );

        return;
    }


    imageUrls.push(
        publicUrlData.publicUrl
    );


    console.log(
        "Image URL added:",
        publicUrlData.publicUrl
    );
}


/* ==============================
   MAIN IMAGE
============================== */

const imageUrl =
    imageUrls.length > 0
        ? imageUrls[0]
        : null;


console.log(
    "FINAL IMAGE URLS:",
    imageUrls
);

    /* ==============================
       GET SELECTED CATEGORIES
    ============================== */

    const selectedCategories =
        Array.from(
            document.querySelectorAll(
                '#categoryOptions input[name="stampCategory"]:checked'
            )
        )
        .map(input => input.value.trim())
        .filter(value => value !== "");


    console.log(
        "Selected categories:",
        selectedCategories
    );


    /* ==============================
       BUILD STAMP DATA
    ============================== */

    const stamp = {

        name:
            document.getElementById("stampName")
                .value
                .trim(),

        description:
            document.getElementById("stampDescription")
                .value
                .trim(),

        price:
            document.getElementById("stampPrice")
                .value
                ? Number(
                    document.getElementById("stampPrice")
                        .value
                  )
                : null,

        location:
            document.getElementById("stampLocation")
                .value
                .trim(),

        category:
            selectedCategories,

        collection_date:
            document.getElementById("stampDate")
                .value || null,

        favorite:
            document.getElementById("stampFavorite")
                .checked,

        image_url:
            imageUrl,

        image_urls:
            imageUrls
};


    console.log(
        "Saving stamp:",
        stamp
    );


    /* ==============================
       UPDATE EXISTING STAMP
    ============================== */

    if (editingStampId !== null) {

        const { data, error } =
            await supabaseClient
                .from("Stamps")
                .update(stamp)
                .eq("id", editingStampId)
                .select()
                .single();


        if (error) {

            console.error(
                "Error updating stamp:",
                error
            );

            alert(
                "Unable to update stamp: " +
                error.message
            );

            return;
        }


        console.log(
            "Stamp updated successfully:",
            data
        );


        alert(
            "Stamp updated successfully!"
        );
    }


    /* ==============================
       INSERT NEW STAMP
    ============================== */

    else {

        const { data, error } =
            await supabaseClient
                .from("Stamps")
                .insert([stamp])
                .select()
                .single();


        if (error) {

            console.error(
                "Error adding stamp:",
                error
            );

            alert(
                "Unable to add stamp: " +
                error.message
            );

            return;
        }


        console.log(
            "Stamp added successfully:",
            data
        );


        alert(
            "Stamp added successfully!"
        );
    }


    /* ==============================
       RESET + RELOAD
    ============================== */

    resetStampForm();

    await loadStamps();
});


/* ==============================
   FILTER EVENTS
============================== */

document.getElementById("searchInput")
    .addEventListener(
        "input",
        filterStamps
    );


document.getElementById("categoryFilter")
    .addEventListener(
        "change",
        filterStamps
    );


document.getElementById("favoriteFilter")
    .addEventListener(
        "change",
        filterStamps
    );


document.getElementById("sortFilter")
    .addEventListener(
        "change",
        filterStamps
    );


/* ==============================
   CLEAR FILTERS
============================== */

document.getElementById("clearFiltersButton")
    .addEventListener("click", () => {

        document.getElementById("searchInput").value = "";

        document.getElementById("categoryFilter").value = "all";

        document.getElementById("favoriteFilter").value = "all";

        document.getElementById("sortFilter").value = "newest";

        filterStamps();
    });

/* ==============================
   EDIT STAMP
============================== */

function editStamp(id) {

    const stamp =
        allStamps.find(
            item => item.id === id
        );


    if (!stamp) {

        alert("Stamp not found.");

        return;
    }


    editingStampId = id;


    /* Change title */

    const formTitle =
        document.querySelector("#addForm h2");

    if (formTitle) {
        formTitle.textContent =
            "Edit Stamp";
    }


    /* Change save button */

    const submitButton =
        stampForm.querySelector(
            'button[type="submit"]'
        );

    if (submitButton) {
        submitButton.textContent =
            "Save Changes";
    }


    /* Fill existing information */

    document.getElementById("stampName")
        .value =
            stamp.name || "";


    document.getElementById("stampDescription")
        .value =
            stamp.description || "";


    document.getElementById("stampPrice")
        .value =
            stamp.price ?? "";


    document.getElementById("stampLocation")
        .value =
            stamp.location || "";


    /* Categories */

    const stampCategories =
        Array.isArray(stamp.category)
            ? stamp.category
            : typeof stamp.category === "string"
                ? [stamp.category]
                : [];


    renderCategoryCheckboxes(stampCategories);


    /* Date */

    document.getElementById("stampDate")
        .value =
            stamp.collection_date || "";


    /* Favorite */

    document.getElementById("stampFavorite")
        .checked =
            stamp.favorite || false;


    /* Existing image */

    const oldPreview =
    document.getElementById("imagePreviewContainer");

if (oldPreview) {
    oldPreview.remove();
}

const existingImageUrls =
    Array.isArray(stamp.image_urls) &&
    stamp.image_urls.length > 0
        ? stamp.image_urls
        : stamp.image_url
            ? [stamp.image_url]
            : [];

if (existingImageUrls.length > 0) {

    const previewContainer =
        document.createElement("div");

    previewContainer.id =
        "imagePreviewContainer";

    previewContainer.className =
        "image-preview-container";

    existingImageUrls.forEach(imageUrl => {

        const preview =
            document.createElement("img");

        preview.className =
            "image-preview";

        preview.src =
            imageUrl;

        preview.alt =
            "Stamp image";

        previewContainer.appendChild(
            preview
        );
    });

    stampImageInput.parentElement.appendChild(
        previewContainer
    );
}


    /* Open popup */

    addForm.classList.add(
        "editing-mode"
    );

    addForm.style.display =
        "block";

    addStampButton.style.display =
        "none";


    /* Prevent background scrolling */

    document.body.classList.add(
        "editing-popup-open"
    );
}


/* ==============================
   DELETE STAMP
============================== */

async function deleteStamp(id) {

    const stamp =
        allStamps.find(
            item => item.id === id
        );


    if (!stamp) {

        alert("Stamp not found.");

        return;
    }


    const confirmed =
        confirm(
            `Are you sure you want to delete "${stamp.name}"?`
        );


    if (!confirmed) {
        return;
    }


    const { error: deleteError } =
        await supabaseClient
            .from("Stamps")
            .delete()
            .eq("id", id);


    if (deleteError) {

        console.error(
            "Error deleting stamp:",
            deleteError
        );

        alert(
            "Unable to delete stamp: " +
            deleteError.message
        );

        return;
    }


    /* Delete image */

    if (stamp.image_url) {

        try {

            const imageUrl =
                new URL(stamp.image_url);


            const pathParts =
                imageUrl.pathname.split(
                    "/storage/v1/object/public/stamps/"
                );


            if (pathParts.length === 2) {

                const filePath =
                    decodeURIComponent(
                        pathParts[1]
                    );


                const { error: storageError } =
                    await supabaseClient.storage
                        .from("stamps")
                        .remove([filePath]);


                if (storageError) {

                    console.error(
                        "Storage deletion error:",
                        storageError
                    );
                }
            }

        } catch (storageError) {

            console.error(
                "Unable to determine image path:",
                storageError
            );
        }
    }


    alert(
        "Stamp and its photo deleted successfully!"
    );


    loadStamps();
}


/* ==============================
   FAVORITE
============================== */

async function toggleFavorite(id) {

    const stamp =
        allStamps.find(
            item => item.id === id
        );


    if (!stamp) {

        alert("Stamp not found.");

        return;
    }


    const newFavorite =
        !stamp.favorite;


    const { error } =
        await supabaseClient
            .from("Stamps")
            .update({
                favorite: newFavorite
            })
            .eq("id", id);


    if (error) {

        console.error(
            "Error updating favorite:",
            error
        );

        alert(
            "Unable to update favorite: " +
            error.message
        );

        return;
    }


    stamp.favorite =
        newFavorite;


    filterStamps();
}

/* ==============================
   CHANGE MAIN CARD IMAGE
============================== */

function changeMainImage(
    stampId,
    imageUrl,
    thumbnail
) {

    const mainImage =
        document.getElementById(
            `main-image-${stampId}`
        );

    if (!mainImage) {
        return;
    }


    mainImage.src =
        imageUrl;


    const cardImage =
        thumbnail.closest(".card-image");


    if (!cardImage) {
        return;
    }


    cardImage
        .querySelectorAll(".image-thumbnail")
        .forEach(item => {

            item.classList.remove("active");

        });


    thumbnail.classList.add("active");
}

/* ==============================
   STAMP DETAILS POPUP
============================== */

function handleStampImageClick(event, id) {

    const addForm = document.getElementById("addForm");

    // If Add/Edit popup is open,
    // clicking a stamp image should only close the popup.
    if (
        addForm &&
        addForm.style.display !== "none"
    ) {
        event.stopPropagation();
        resetStampForm();
        return;
    }

    // Otherwise, open the image preview
    openStampModal(id);
}


function openStampModal(id) {

    const stamp =
        allStamps.find(
            item => item.id === id
        );


    if (!stamp) {
        return;
    }

    window.currentModalStampId = id;

    const modal =
        document.getElementById("stampModal");

    const modalContent =
        document.getElementById("modalContent");


    const imageUrls =
    Array.isArray(stamp.image_urls) &&
    stamp.image_urls.length > 0
        ? stamp.image_urls
        : stamp.image_url
            ? [stamp.image_url]
            : [];

const image =
    imageUrls.length > 0
        ? `
            <div class="modal-image-gallery">

                <div class="modal-main-image-container">

    ${
        imageUrls.length > 1
            ? `
                <button
                    class="modal-arrow modal-arrow-left"
                    onclick="event.stopPropagation(); changeModalImageByStep(-1);"
                >
                    ‹
                </button>
              `
            : ""
    }

    <img
        id="modal-main-image"
        class="modal-main-image"
        src="${imageUrls[0]}"
        alt="${stamp.name || "Stamp"}"
    >

    ${
        imageUrls.length > 1
            ? `
                <button
                    class="modal-arrow modal-arrow-right"
                    onclick="event.stopPropagation(); changeModalImageByStep(1);"
                >
                    ›
                </button>
              `
            : ""
    }

</div>

                ${
                    imageUrls.length > 1
                        ? `
                            <div class="modal-thumbnails">

                                ${imageUrls.map((imageUrl, index) => `
                                    <img
                                        class="
                                            modal-thumbnail
                                            ${index === 0 ? "active" : ""}
                                        "
                                        src="${imageUrl}"
                                        alt="${stamp.name || "Stamp"} photo ${index + 1}"
                                        onclick="
                                            event.stopPropagation();
                                            changeModalImage(
                                                '${imageUrl.replace(/'/g, "\\'")}',
                                                this
                                            );
                                        "
                                    >
                                `).join("")}

                            </div>
                          `
                        : ""
                }

            </div>
          `
        : "";

    const price =
        stamp.price !== null &&
        stamp.price !== undefined

            ? `RM ${Number(stamp.price).toFixed(2)}`

            : "Not specified";


    const favorite =
        stamp.favorite
            ? "♥ Favorite"
            : "♡ Not a favorite";


    const categories =
        Array.isArray(stamp.category)
            ? stamp.category
            : typeof stamp.category === "string"
                ? [stamp.category]
                : [];


    const categoryText =
        categories.length
            ? categories.join(" · ")
            : "";


    modalContent.innerHTML = `

        ${image}

        <div class="modal-title">
            ${stamp.name || "Unnamed Stamp"}
        </div>

        <div class="modal-description">
            ${stamp.description || "No description"}
        </div>

        <div class="modal-info">

            ${
                stamp.location
                    ? `📍 ${stamp.location}<br>`
                    : ""
            }

            ${
                stamp.collection_date
                    ? `📅 ${formatDate(
                        stamp.collection_date
                    )}<br>`
                    : ""
            }

            ${
                categoryText
                    ? `🏷️ ${categoryText}<br>`
                    : ""
            }

            ${favorite}

        </div>

        <div class="modal-price">
            ${price}
        </div>
    `;


    modal.style.display = "flex";
}

function changeModalImage(imageUrl, thumbnail) {

    const mainImage =
        document.getElementById("modal-main-image");

    if (!mainImage) {
        return;
    }

    mainImage.src = imageUrl;

    const thumbnailContainer =
        thumbnail.closest(".modal-thumbnails");

    if (!thumbnailContainer) {
        return;
    }

    thumbnailContainer
        .querySelectorAll(".modal-thumbnail")
        .forEach(item => {
            item.classList.remove("active");
        });

    thumbnail.classList.add("active");
}

function changeModalImageByStep(step) {

    const stampId =
        window.currentModalStampId;

    if (!stampId) {
        return;
    }

    const stamp =
        allStamps.find(
            item => item.id === stampId
        );

    if (!stamp) {
        return;
    }

    const imageUrls =
        Array.isArray(stamp.image_urls) &&
        stamp.image_urls.length > 0
            ? stamp.image_urls
            : stamp.image_url
                ? [stamp.image_url]
                : [];

    if (imageUrls.length <= 1) {
        return;
    }

    const mainImage =
        document.getElementById(
            "modal-main-image"
        );

    if (!mainImage) {
        return;
    }

    let currentIndex =
        imageUrls.indexOf(
            mainImage.src
        );

    if (currentIndex === -1) {
        currentIndex = 0;
    }

    let newIndex =
        currentIndex + step;

    if (newIndex < 0) {
        newIndex =
            imageUrls.length - 1;
    }

    if (newIndex >= imageUrls.length) {
        newIndex = 0;
    }

    mainImage.src =
        imageUrls[newIndex];

    const thumbnails =
        document.querySelectorAll(
            ".modal-thumbnail"
        );

    thumbnails.forEach((thumbnail, index) => {
        thumbnail.classList.toggle(
            "active",
            index === newIndex
        );
    });
}

/* ==============================
   CLOSE DETAILS POPUP
============================== */

document.getElementById("modalClose")
    .addEventListener("click", () => {

        document.getElementById("stampModal")
            .style.display = "none";
    });


document.getElementById("stampModal")
    .addEventListener("click", (event) => {

        if (
            event.target.id === "stampModal"
        ) {

            document.getElementById("stampModal")
                .style.display = "none";
        }
    });


/* ==============================
   START
============================== */

loadCategories();
loadStamps();