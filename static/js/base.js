$(document).ready(function() {
    // --------- Theme Switcher Logic ---------
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark-theme') {
        $('body').removeClass('light-theme').addClass('dark-theme');
        $('#theme-switch').prop('checked', true);
    } else {
        $('body').removeClass('dark-theme').addClass('light-theme');
        $('#theme-switch').prop('checked', false);
    }

    // Handle custom theme switcher click
    $('#custom-theme-switch').on('click', function() {
        const isDark = $('body').hasClass('dark-theme');
        if (isDark) {
            $('body').removeClass('dark-theme').addClass('light-theme');
            $('#theme-switch').prop('checked', false);
            localStorage.setItem('theme', 'light-theme');
        } else {
            $('body').removeClass('light-theme').addClass('dark-theme');
            $('#theme-switch').prop('checked', true);
            localStorage.setItem('theme', 'dark-theme');
        }
    });

    // --------- Shared Reports Popup Logic ---------
    // Initialize shared reports modal
    const sharedReportsModal = new bootstrap.Modal(document.getElementById('sharedReportsModal'));

    // Store unread report IDs
    let unreadReportIds = [];

    // Function to fetch unread report count
    function fetchUnreadBadgeCount() {
        fetch('/dashboard/getUnreadReportCount')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'Success') {
                    const count = data.reportCount || 0;
                    const unreadBadge = $('#unreadReportCount');
                    if (count > 0) {
                        unreadBadge.text(count > 99 ? '99+' : count);
                        unreadBadge.show();
                    } else {
                        unreadBadge.hide();
                    }
                }
            })
            .catch(error => console.error('Error fetching unread count:', error));
    }

    // Function to fetch unread report ID list
    function fetchUnreadReportIds() {
        // Use the new API endpoint to get the list of unread report IDs
        fetch('/dashboard/getUnreadReportIds')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'Success') {
                    unreadReportIds = data.unreadReportIds || [];
                } else {
                    unreadReportIds = [];
                }
            })
            .catch(error => console.error('Error fetching unread report IDs:', error));
    }

    // Function to fetch shared reports list
    function fetchSharedReportsList() {
        $('#sharedReportsLoading').show();
        $('#sharedReportsContent').hide();

        // Fetch unread report IDs first
        fetchUnreadReportIds();

        fetch('/dashboard/getSenderDetails')
            .then(response => response.json())
            .then(data => {
                $('#sharedReportsLoading').hide();
                $('#sharedReportsContent').show();
                if (data.status === 'Success' && data.data && data.data.length > 0) {
                    $('#noSharedReports').hide();
                    const reportsList = $('#sharedReportsList');
                    reportsList.empty();
                    data.data.forEach(report => {
                        const reportDate = new Date(report.sharedDate);
                        const formattedDate = reportDate.toLocaleDateString() + ' ' + reportDate.toLocaleTimeString();
                        
                        // Check if this report is unread
                        const isUnread = unreadReportIds.includes(report.senderID);
                        const unreadDot = isUnread ? 
                            '<span class="unread-dot position-absolute top-0 start-0 translate-middle p-1 bg-danger rounded-circle"></span>' : '';
                        
                        const listItem = `
                            <li class="list-group-item shared-report-item position-relative ${isUnread ? 'unread-report' : ''}" data-sender-id="${report.senderID}">
                                ${unreadDot}
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-0">${report.senderFirstName} ${report.senderLastName}</h6>
                                        <small class="text-muted">${formattedDate}</small>
                                    </div>
                                    <button class="btn btn-sm btn-primary view-report-btn">
                                        <i class="fas fa-eye me-1"></i>View
                                    </button>
                                </div>
                            </li>
                        `;
                        reportsList.append(listItem);
                    });
                    // Bind click events
                    $('.view-report-btn, .shared-report-item').off('click').on('click', function(e) {
                        const senderID = $(this).closest('.shared-report-item').data('sender-id');
                        viewSharedReport(senderID);
                    });
                } else {
                    $('#noSharedReports').show();
                }
            })
            .catch(error => {
                console.error('Error fetching shared reports:', error);
                $('#sharedReportsLoading').hide();
                $('#sharedReportsContent').show();
                $('#noSharedReports').show();
                $('#noSharedReports p').text('Error loading shared reports. Please try again.');
            });
    }

    // Function to view a shared report
    function viewSharedReport(senderID) {
        // Remove from unread list
        const index = unreadReportIds.indexOf(senderID);
        if (index > -1) {
            unreadReportIds.splice(index, 1);
        }

        // Mark report as read on server (non-blocking)
        fetch('/dashboard/markReportAsRead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportId: senderID })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'Success') {
                fetchUnreadBadgeCount();
                $(`.shared-report-item[data-sender-id="${senderID}"]`)
                    .removeClass('unread-report')
                    .find('.unread-dot')
                    .remove();
            }
        })
        .catch(error => console.error('Error marking report as read:', error));

        // Fetch the full shared report data
        fetch('/dashboard/getSharedReport', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderID: senderID, recipientID: window.currentUserID || null })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'Success') {
                // Store report data and redirect to view page
                sessionStorage.setItem('sharedReportData', JSON.stringify(data));
                window.location.href = '/shared-report-view';
            } else {
                showAlert('Failed to load report: ' + (data.message || 'Unknown error'), 'danger');
            }
        })
        .catch(error => {
            console.error('Error fetching shared report:', error);
            showAlert('Error loading report: ' + error.message, 'danger');
        });
    }

    // Click handler for 'Shared with me' button
    $('#sharedWithMeBtn').on('click', function() {
        fetchSharedReportsList();
        sharedReportsModal.show();
    });

    // Refresh unread count when modal closes
    $('#sharedReportsModal').on('hidden.bs.modal', function() {
        fetchUnreadBadgeCount();
    });

    // Initial load and periodic refresh
    fetchUnreadBadgeCount();
    fetchUnreadReportIds();
    setInterval(fetchUnreadBadgeCount, 5 * 60 * 1000); // every 5 minutes
});