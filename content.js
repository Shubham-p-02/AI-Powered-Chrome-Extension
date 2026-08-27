const bookmarkImgURL = chrome.runtime.getURL("assets/bookmark.png");
const AZ_PROBLEM_KEY = "AZ_PROBLEM_KEY";

const observer = new MutationObserver(() => {
    addBookmarkButton();
});

observer.observe(document.body, {childList: true, subtree: true});

addBookmarkButton();

function onProblemsPage(){
    return window.location.pathname.startsWith('/problems/');
}

function addBookmarkButton() {
    if(!onProblemsPage() || document.getElementById("add-bookmark-button")) return;

    const bookmarkButton = document.createElement('img');
    bookmarkButton.id = "add-bookmark-button";
    bookmarkButton.src = bookmarkImgURL;
    bookmarkButton.style.height = "30px";
    bookmarkButton.style.width = "30px";
    bookmarkButton.style.cursor = "pointer";

    const insertTarget = getInsertTarget();
    if(!insertTarget) return;

    insertTarget.insertAdjacentElement("afterend", bookmarkButton);

    bookmarkButton.addEventListener("click", addNewBookmarkHandler);
}

async function addNewBookmarkHandler() {
    const currentBookmarks = await getCurrentBookmarks();

    const azProblemUrl = window.location.href;
    const uniqueId = extractUniqueId(azProblemUrl);
    const problemName = getProblemName();

    if(!uniqueId) return;

    if(currentBookmarks.some((bookmark) => bookmark.id === uniqueId)) return;

    const bookmarkObj = {
        id: uniqueId,
        name: problemName,
        url: azProblemUrl
    }

    const updatedBookmarks = [...currentBookmarks, bookmarkObj];

    chrome.storage.sync.set({AZ_PROBLEM_KEY: updatedBookmarks}, () => {
        console.log("Updated the bookmarks correctly to ", updatedBookmarks);
    })
}
function extractUniqueId(url) {
    const start = url.indexOf("problems/") + "problems/".length;
    const end = url.indexOf("?", start);
    const extractedId = end === -1 ? url.substring(start) : url.substring(start, end);
    return extractedId.replace(/\/+$/, "");
}

function getCurrentBookmarks() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([AZ_PROBLEM_KEY], (results) => {
            resolve(results[AZ_PROBLEM_KEY] || []);
        });
    });
}

function getInsertTarget() {
    const classBasedTarget = document.getElementsByClassName("coding_ask_doubt_button__FjwXJ")[0];
    if(classBasedTarget?.parentNode) return classBasedTarget.parentNode;

    const actionButton = [...document.querySelectorAll("button, a")]
        .find((item) => /doubt|hint|discussion/i.test(item.textContent || ""));
    if(actionButton?.parentNode) return actionButton.parentNode;

    return null;
}

function getProblemName() {
    const classBasedTitle = document.getElementsByClassName("Header_resource_heading__cpRp1")[0];
    if(classBasedTitle?.innerText?.trim()) return classBasedTitle.innerText.trim();

    const heading = document.querySelector("h1");
    if(heading?.textContent?.trim()) return heading.textContent.trim();

    return document.title || "AZ Problem";
}
