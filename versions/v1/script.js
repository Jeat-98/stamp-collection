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
        document.getElementById("categoryFilter").value;

    const favoriteFilter =
        document.getElementById("favoriteFilter").value;

    const sortFilter =
        document.getElementById("sortFilter").value;


    let filtered = allStamps.filter(stamp => {

        const matchesSearch =
            !searchText ||
            (stamp.name || "").toLowerCase().includes(searchText) ||
            (stamp.description || "").toLowerCase().includes(searchText) ||
            (stamp.location || "").toLowerCase().includes(searchText);


        const stampCategories =
            Array.isArray(stamp.category)
                ? stamp.category
                : typeof stamp.category === "string"
                    ? [stamp.category]
                    : [];


        const matchesCategory =
            category === "all" ||
            stampCategories.includes(category);


        const matchesFavorite =
            favoriteFilter === "all" ||
            stamp.favorite === true;


        return (
            matchesSearch &&
            matchesCategory &&
            matchesFavorite
        );
    });


    filtered.sort((a, b) => {

        switch (sortFilter) {

            case "newest":
                return new Date(b.collection_date || 0) -
                       new Date(a.collection_date || 0);

            case "oldest":
                return new Date(a.collection_date || 0) -
                       new Date(b.collection_date || 0);

            case "nameAsc":
                return (a.name || "")
                    .localeCompare(b.name || "");

            case "nameDesc":
                return (b.name || "")
                    .localeCompare(a.name || "");

            case "priceLow":
                return (a.price ?? 0) -
                       (b.price ?? 0);

            case "priceHigh":
                return (b.price ?? 0) -
                       (a.price ?? 0);

            default:
                return 0;
        }
    });


    displayStamps(filtered);
}


/* ==============================
   DISPLAY STAMPS
============================== */

function displayStamps(items) {

    const gallery =
        document.getElementById("gallery");

    const collectionCount =
        document.getElementById("collectionCount");


    /* Collection count */

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


/* ==============================
   CATEGORY STATISTICS
============================== */

const categoryStats =
    document.getElementById("categoryStats");

if (categoryStats) {

    const categoryCounts = {
        Stamps: 0,
        LEGO: 0,
        Pokémon: 0,
        Others: 0
    };


    allStamps.forEach(stamp => {

        const categories =
            Array.isArray(stamp.category)
                ? stamp.category
                : typeof stamp.category === "string"
                    ? [stamp.category]
                    : [];


        categories.forEach(category => {

            if (
                Object.prototype.hasOwnProperty.call(
                    categoryCounts,
                    category
                )
            ) {
                categoryCounts[category]++;
            }
        });
    });


    categoryStats.innerHTML =
        Object.entries(categoryCounts)
            .filter(
                ([, count]) => count > 0
            )
            .map(([category, count]) => {

                const categoryClass =
                    category
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(
                            /[\u0300-\u036f]/g,
                            ""
                        )
                        .replace(
                            /[^a-z0-9]/g,
                            ""
                        );


                return `
                    <span
                        class="category-stat category-stat-${categoryClass}"
                    >
                        ${category}
                        <span class="category-stat-count">
                            ${count}
                        </span>
                    </span>
                `;

            })
            .join("");
}


    /* Empty */

    if (!items || items.length === 0) {

        gallery.innerHTML = `
            <div class="empty">

                <h2>No stamps yet</h2>

                <p>
                    Click "+ Add Stamp" to add your first stamp.
                </p>

            </div>
        `;

        return;
    }


    /* Cards */

    gallery.innerHTML = items.map(item => {

        const image = item.image_url

            ? `
                <img
                    src="${item.image_url}"
                    alt="${item.name || "Stamp"}"
                >
              `

            : `
                <div class="no-image">
                    No Image
                </div>
              `;


        const favorite =
            item.favorite
                ? "♥"
                : "♡";


        const price =
            item.price !== null &&
            item.price !== undefined

                ? `RM ${Number(item.price).toFixed(2)}`

                : "";


        /* Categories */

        let categories = [];

        if (Array.isArray(item.category)) {

            categories =
                item.category.filter(
                    category =>
                        typeof category === "string" &&
                        category.trim() !== ""
                );

        } else if (
            typeof item.category === "string" &&
            item.category.trim() !== ""
        ) {

            categories = [item.category];
        }


        const categoryBadges =
            categories.length

                ? `
                    <div class="card-categories">

                        ${categories.map(category => {

                            const categoryClass =
                                category
                                    .toLowerCase()
                                    .normalize("NFD")
                                    .replace(
                                        /[\u0300-\u036f]/g,
                                        ""
                                    )
                                    .replace(
                                        /[^a-z0-9]/g,
                                        ""
                                    );


                            return `
                                <span
                                    class="category-badge category-${categoryClass}"
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

                <div
                    class="card-image"
                    onclick="openStampModal(${item.id})"
                >

                    ${image}

                </div>


                <div class="card-content">


                    <button
                        class="favorite-button ${
                            item.favorite
                                ? "active"
                                : ""
                        }"
                        onclick="toggleFavorite(${item.id})"
                        title="Toggle favorite"
                    >
                        ${favorite}
                    </button>


                    <button
                        class="edit-button"
                        onclick="editStamp(${item.id})"
                    >
                        ✏️ Edit
                    </button>


                    <button
                        class="delete-button"
                        onclick="deleteStamp(${item.id})"
                    >
                        🗑️ Delete
                    </button>


                    <div class="card-title">
                        ${item.name || "Unnamed Stamp"}
                    </div>


                    ${categoryBadges}


                    <div class="card-description">
                        ${item.description || ""}
                    </div>


                    <div class="card-info">

                        ${
                            item.location
                                ? `📍 ${item.location}<br>`
                                : ""
                        }

                        ${
                            item.collection_date
                                ? `📅 ${formatDate(
                                    item.collection_date
                                )}`
                                : ""
                        }

                    </div>


                    <div class="price">
                        ${price}
                    </div>

                </div>

            </div>

        `;

    }).join("");
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

    const file =
        stampImageInput.files[0];

    if (!file) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload = function(event) {

        let preview =
            document.getElementById("imagePreview");


        if (!preview) {

            preview =
                document.createElement("img");

            preview.id =
                "imagePreview";

            preview.className =
                "image-preview";


            stampImageInput
                .parentElement
                .appendChild(preview);
        }


        preview.src =
            event.target.result;
    };


    reader.readAsDataURL(file);
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


    const preview =
        document.getElementById("imagePreview");

    if (preview) {
        preview.remove();
    }
}


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


    const preview =
        document.getElementById("imagePreview");

    if (preview) {
        preview.remove();
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


    const imageFile =
        document.getElementById("stampImage")
            .files[0];


    let imageUrl = null;


    /* Keep existing image during edit */

    if (editingStampId) {

        const existingStamp =
            allStamps.find(
                item => item.id === editingStampId
            );


        imageUrl =
            existingStamp
                ? existingStamp.image_url
                : null;
    }


    /* Upload new image */

    if (imageFile) {

        const fileExtension =
            imageFile.name
                .split(".")
                .pop();


        const fileName =
            `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2)}.${fileExtension}`;


        const filePath =
            `stamps/${fileName}`;


        const { error: uploadError } =
            await supabaseClient.storage
                .from("stamps")
                .upload(
                    filePath,
                    imageFile
                );


        if (uploadError) {

            console.error(
                "Image upload error:",
                uploadError
            );

            alert(
                "Unable to upload image: " +
                uploadError.message
            );

            return;
        }


        const { data: publicUrlData } =
            supabaseClient.storage
                .from("stamps")
                .getPublicUrl(filePath);


        imageUrl =
            publicUrlData.publicUrl;
    }


    /* Multiple categories */

    const selectedCategories =
        Array.from(
            document.querySelectorAll(
                'input[name="stampCategory"]:checked'
            )
        ).map(
            input => input.value
        );


    const stamp = {

        name:
            document.getElementById("stampName")
                .value,

        description:
            document.getElementById("stampDescription")
                .value,

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
                .value,

        category:
            selectedCategories,

        collection_date:
            document.getElementById("stampDate")
                .value || null,

        favorite:
            document.getElementById("stampFavorite")
                .checked,

        image_url:
            imageUrl
    };


    let error;


    /* UPDATE */

    if (editingStampId) {

        const result =
            await supabaseClient
                .from("Stamps")
                .update(stamp)
                .eq("id", editingStampId);

        error =
            result.error;
    }


    /* INSERT */

    else {

        const result =
            await supabaseClient
                .from("Stamps")
                .insert([stamp]);

        error =
            result.error;
    }


    if (error) {

        console.error(
            "Error saving stamp:",
            error
        );

        alert(
            "Unable to save stamp: " +
            error.message
        );

        return;
    }


    alert(
        editingStampId
            ? "Stamp updated successfully!"
            : "Stamp added successfully!"
    );


    resetStampForm();

    loadStamps();
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

        document.getElementById("searchInput")
            .value = "";

        document.getElementById("categoryFilter")
            .value = "all";

        document.getElementById("favoriteFilter")
            .value = "all";

        document.getElementById("sortFilter")
            .value = "newest";

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


    document
        .querySelectorAll(
            'input[name="stampCategory"]'
        )
        .forEach(input => {

            input.checked =
                stampCategories.includes(
                    input.value
                );
        });


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
        document.getElementById("imagePreview");

    if (oldPreview) {
        oldPreview.remove();
    }


    if (stamp.image_url) {

        const preview =
            document.createElement("img");

        preview.id =
            "imagePreview";

        preview.className =
            "image-preview";

        preview.src =
            stamp.image_url;


        stampImageInput
            .parentElement
            .appendChild(preview);
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
   STAMP DETAILS POPUP
============================== */

function openStampModal(id) {

    const stamp =
        allStamps.find(
            item => item.id === id
        );


    if (!stamp) {
        return;
    }


    const modal =
        document.getElementById("stampModal");

    const modalContent =
        document.getElementById("modalContent");


    const image =
        stamp.image_url

            ? `
                <img
                    class="modal-image"
                    src="${stamp.image_url}"
                    alt="${stamp.name || "Stamp"}"
                >
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

loadStamps();