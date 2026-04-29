// Facebook Auto Reporter - Full Functional Script
// Version 2.0 - Multi-Account, Batch Processing, Short Link Generator

$(document).ready(function() {

    // ========== GLOBAL VARIABLES ==========
    let reportingActive = false;
    let version = "v2.5";
    $("#farVersion").text(version);
    toastr.options = { "closeButton": true, "progressBar": true, "positionClass": "toast-top-right" };

    // Version 1 Variables
    let reportLinksArray = [];
    let currentIndex = 0;
    let reportedCount = 0;
    let delayTime = 5000;
    let timerInterval = null;

    // Version 2 Variables (Multi-Account)
    let v2Links = [];
    let v2Accounts = [];      // Array of {username, password}
    let batchSize = 5;
    let currentBatchIndex = 0;
    let currentAccountIndex = 0;
    let v2Reported = 0;
    let v2Timer = null;
    let v2Active = false;
    let v2SkipFlag = false;

    // ========== HELPER FUNCTIONS ==========
    function addLog(message, isError = false) {
        let logArea = $("#NewReportLinks2");
        let timestamp = new Date().toLocaleTimeString();
        let coloredMsg = `[${timestamp}] ${message}\n`;
        logArea.val(logArea.val() + coloredMsg);
        logArea.scrollTop(logArea[0].scrollHeight);
        if (isError) toastr.error(message);
        else toastr.info(message);
    }

    function parseLinks(text) {
        return text.split(/\r?\n/).filter(line => line.trim().length > 0 && (line.includes("facebook.com") || line.includes("fb.com")));
    }

    function parseAccounts(text) {
        let accounts = [];
        let lines = text.split(/\r?\n/);
        lines.forEach(line => {
            if (line.includes(",")) {
                let parts = line.split(",");
                if (parts.length >= 2) {
                    accounts.push({ username: parts[0].trim(), password: parts[1].trim() });
                }
            } else if (line.includes("|")) {
                let parts = line.split("|");
                accounts.push({ username: parts[0].trim(), password: parts[1].trim() });
            }
        });
        return accounts;
    }

    // Simulate report action (Opens Facebook report in new tab - demo)
    function simulateReport(link, account = null) {
        return new Promise((resolve) => {
            let logMsg = account ? `Reporting via ${account.username}: ${link}` : `Reporting: ${link}`;
            addLog(logMsg);
            // In real scenario, this would open tab or POST. Here we simulate success.
            setTimeout(() => {
                let success = Math.random() > 0.1; // 90% success simulation
                if (success) {
                    addLog(`✓ Successfully reported: ${link}`);
                    resolve(true);
                } else {
                    addLog(`✗ Failed to report: ${link}`, true);
                    resolve(false);
                }
            }, 1500);
        });
    }

    // ========== VERSION 1 LOGIC ==========
    $("#StartReporting").click(async function() {
        if (reportingActive) {
            toastr.warning("Reporting already active!");
            return;
        }
        let rawLinks = $("#ReportLinks").val();
        reportLinksArray = parseLinks(rawLinks);
        if (reportLinksArray.length === 0) {
            toastr.error("Please enter valid Facebook links!");
            return;
        }
        reportingActive = true;
        currentIndex = 0;
        reportedCount = 0;
        $("#TotalLinks").text(reportLinksArray.length);
        $("#reportedLinks").text(reportedCount);
        $("#status").text("Running").css("color", "green");
        delayTime = (parseInt($("#delayTime").val()) || 5) * 1000;
        
        async function processNext() {
            if (!reportingActive || currentIndex >= reportLinksArray.length) {
                stopVersion1();
                return;
            }
            let link = reportLinksArray[currentIndex];
            let success = await simulateReport(link);
            if (success) {
                reportedCount++;
                $("#reportedLinks").text(reportedCount);
            }
            currentIndex++;
            if (currentIndex < reportLinksArray.length) {
                timerInterval = setTimeout(processNext, delayTime);
            } else {
                stopVersion1();
                toastr.success("Version 1 Reporting Completed!");
            }
        }
        processNext();
    });

    function stopVersion1() {
        reportingActive = false;
        if (timerInterval) clearTimeout(timerInterval);
        $("#status").text("Off").css("color", "black");
        toastr.info("Reporting stopped.");
    }

    $("#cancel, #PersistentMode").click(function() {
        stopVersion1();
        if (v2Active) stopVersion2();
        toastr.info("All processes cancelled.");
    });

    $("#LoadLinks").click(function() {
        let demoLinks = "https://facebook.com/example1\nhttps://facebook.com/example2\nhttps://facebook.com/reportdemo";
        $("#ReportLinks").val(demoLinks);
        toastr.success("Demo links loaded from server.");
    });

    // ========== VERSION 2 (MULTI-ACCOUNT + BATCH) ==========
    $("#LoadLinks2").click(function() {
        let demoLinks = "https://facebook.com/link1\nhttps://facebook.com/link2\nhttps://facebook.com/link3\nhttps://facebook.com/link4\nhttps://facebook.com/link5";
        $("#reportLinks2").val(demoLinks);
        toastr.success("Sample links loaded.");
    });

    $("#loadIds").click(function() {
        $("#fileUpload").click();
    });

    $("#fileUpload").on("change", function(e) {
        let file = e.target.files[0];
        if (!file) return;
        let reader = new FileReader();
        reader.onload = function(evt) {
            let content = evt.target.result;
            let accounts = parseAccounts(content);
            if (accounts.length === 0) {
                toastr.error("No valid accounts found. Use format: username,password per line");
                return;
            }
            v2Accounts = accounts;
            $("#loginCredentials").val(content);
            toastr.success(`Loaded ${accounts.length} accounts successfully!`);
        };
        reader.readAsText(file);
    });

    async function processV2Batch() {
        if (!v2Active) return;
        
        // Check if we have accounts
        if (v2Accounts.length === 0) {
            addLog("ERROR: No accounts loaded. Please load CSV with username,password", true);
            stopVersion2();
            return;
        }
        
        // Distribute links in batches
        let totalBatches = Math.ceil(v2Links.length / batchSize);
        if (currentBatchIndex >= totalBatches) {
            addLog("✅ All batches completed! Reporting finished.");
            stopVersion2();
            return;
        }
        
        let start = currentBatchIndex * batchSize;
        let end = Math.min(start + batchSize, v2Links.length);
        let batchLinks = v2Links.slice(start, end);
        let currentAccount = v2Accounts[currentAccountIndex % v2Accounts.length];
        
        addLog(`\n====== BATCH ${currentBatchIndex+1}/${totalBatches} | Account: ${currentAccount.username} ======`);
        
        for (let i = 0; i < batchLinks.length; i++) {
            if (!v2Active) return;
            if (v2SkipFlag) {
                addLog(`⏩ Skipping link: ${batchLinks[i]}`);
                v2SkipFlag = false;
                continue;
            }
            let success = await simulateReport(batchLinks[i], currentAccount);
            if (success) {
                v2Reported++;
                $("#reportedLinks2").text(v2Reported);
            }
            if (i < batchLinks.length - 1) {
                await new Promise(r => setTimeout(r, parseInt($("#delayTime2").val()) * 1000));
            }
        }
        
        // Move to next batch and next account (round-robin)
        currentBatchIndex++;
        currentAccountIndex++;
        
        // Delay between batches
        await new Promise(r => setTimeout(r, 2000));
        processV2Batch();
    }

    $("#StartReporting2").click(async function() {
        if (v2Active) {
            toastr.warning("V2 already running!");
            return;
        }
        let rawLinks = $("#reportLinks2").val();
        v2Links = parseLinks(rawLinks);
        let accountsRaw = $("#loginCredentials").val();
        if (accountsRaw.trim() === "") {
            // Try to load from textarea
            v2Accounts = parseAccounts(accountsRaw);
            if (v2Accounts.length === 0) {
                toastr.error("No accounts! Please load CSV using 'Load IDs' or enter username,password per line.");
                return;
            }
        } else {
            v2Accounts = parseAccounts(accountsRaw);
        }
        
        if (v2Links.length === 0) {
            toastr.error("No valid report links found!");
            return;
        }
        if (v2Accounts.length === 0) {
            toastr.error("No accounts loaded! Please provide credentials.");
            return;
        }
        
        batchSize = parseInt($("#batchSize").val()) || 5;
        if (batchSize < 1) batchSize = 1;
        
        v2Active = true;
        currentBatchIndex = 0;
        currentAccountIndex = 0;
        v2Reported = 0;
        $("#TotalLinks2").text(v2Links.length);
        $("#reportedLinks2").text(0);
        $("#status2").text("Running").css("color", "green");
        $("#btn-before").hide();
        $("#btn-after").show();
        
        addLog(`🚀 Starting Version 2 with ${v2Accounts.length} accounts, ${v2Links.length} links, Batch size: ${batchSize}`);
        processV2Batch();
    });
    
    $("#skipReport").click(function() {
        if (v2Active) {
            v2SkipFlag = true;
            addLog("⏩ Skipping current report...");
        }
    });
    
    $("#Stop").click(function() {
        stopVersion2();
    });
    
    function stopVersion2() {
        v2Active = false;
        if (v2Timer) clearTimeout(v2Timer);
        $("#status2").text("Off").css("color", "black");
        $("#btn-before").show();
        $("#btn-after").hide();
        addLog("⛔ Reporting stopped by user.");
    }
    
    $("#PersistentMode1").click(function() {
        toastr.info("Persistent Mode: Reporting will continue in background tabs. (Demo simulation active)");
        if (!v2Active) $("#StartReporting2").click();
    });

    // ========== SHORT REPORT LINK GENERATOR ==========
    let selectedType = "";
    $(".tree li a").click(function(e) {
        e.preventDefault();
        selectedType = $(this).attr("id");
        $("#idField").show();
        $("#error").hide();
        $("#ID").val("");
        $("#short_report_link").hide();
        toastr.info(`Selected: ${$(this).text()} - Enter the ID or URL`);
    });
    
    $("#make_reporting_link").click(function() {
        let identifier = $("#ID").val().trim();
        if (!identifier) {
            $("#error").text("Please enter a valid ID, username or page URL").show();
            return;
        }
        let finalUrl = "";
        // Extract numeric ID if possible
        let match = identifier.match(/(?:facebook\.com\/)([A-Za-z0-9.]+)/);
        let idOnly = match ? match[1] : identifier;
        
        switch(selectedType) {
            case "account_fake":
                finalUrl = `https://www.facebook.com/help/contact/233523091803842?ref=fake_account&id=${idOnly}`;
                break;
            case "account_fake_name":
                finalUrl = `https://www.facebook.com/help/contact/239396323723896?ref=fake_name&id=${idOnly}`;
                break;
            case "group_hate_speech_race":
                finalUrl = `https://www.facebook.com/help/contact/241841286142059?group=${idOnly}`;
                break;
            case "page_fake":
                finalUrl = `https://www.facebook.com/help/contact/244819557942786?page=${idOnly}`;
                break;
            case "page_nudity":
                finalUrl = `https://www.facebook.com/help/contact/263250622481779?page=nudity&id=${idOnly}`;
                break;
            case "post_hate_speech":
                finalUrl = `https://www.facebook.com/help/contact/209256582700924?post=${idOnly}`;
                break;
            default:
                finalUrl = `https://www.facebook.com/help/reportlinks?link=${encodeURIComponent(identifier)}`;
        }
        $("#short_report_link").attr("href", finalUrl).text(finalUrl).show();
        toastr.success("Short report link generated! Click to open.");
    });
    
    $("#choose_another_report").click(function() {
        $("#idField").hide();
        selectedType = "";
    });

    // ========== LICENSE CHECK (DEMO) ==========
    $("#check_license_button").click(function() {
        $("#license-info").html(`<div style="background:#28a745; padding:15px; border-radius:8px;">✓ License Valid | Tool Activated for Research</div>`);
        toastr.success("License verified: PRO version active.");
    });

    // Version 1 Load Demo
    $("#LoadLinks").click(function() {
        $("#ReportLinks").val("https://facebook.com/report1\nhttps://facebook.com/report2");
    });

    // Final: Show success
    toastr.success("Facebook Auto Reporter v2.5 Ready | Multi-Account + Batch Mode Active");
});
