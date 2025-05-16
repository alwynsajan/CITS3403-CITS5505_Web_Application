$(document).ready(function() {
    // --------- Responsive Sidebar Logic ---------
    // Handle sidebar toggle for small screens
    $('#sidebarToggle').on('click', function() {
        const sidebar = $('#sidebar');
        const mainContent = $('.main-content');
        const overlay = $('#sidebarOverlay');

        // Check if sidebar is currently visible
        const isSidebarVisible = sidebar.hasClass('sidebar-visible');

        if (isSidebarVisible) {
            // Hide sidebar
            sidebar.removeClass('sidebar-visible');
            mainContent.removeClass('sidebar-visible');
            overlay.removeClass('active');
            $('body').css('overflow', '');
        } else {
            // Show sidebar
            sidebar.addClass('sidebar-visible');
            mainContent.addClass('sidebar-visible');
            overlay.addClass('active');
            $('body').css('overflow', 'hidden'); // Prevent scrolling when sidebar is open
        }
    });

    // Close sidebar when clicking on overlay
    $('#sidebarOverlay').on('click', function() {
        $('#sidebar').removeClass('sidebar-visible');
        $('.main-content').removeClass('sidebar-visible');
        $(this).removeClass('active');
        $('body').css('overflow', '');
    });

    // Close sidebar when clicking on a nav link (for small screens)
    $('.sidebar .nav-link').on('click', function() {
        if (window.innerWidth <= 576) {
            $('#sidebarToggle').click();
        }
    });

    // Handle window resize
    $(window).on('resize', function() {
        if (window.innerWidth > 576) {
            // Reset sidebar state on larger screens
            $('#sidebar').removeClass('sidebar-visible');
            $('.main-content').removeClass('sidebar-visible');
            $('#sidebarOverlay').removeClass('active');
            $('body').css('overflow', '');
        }
    });

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
    // Initialize shared reports modal with proper options
    let sharedReportsModal;
    const sharedReportsModalEl = document.getElementById('sharedReportsModal');

    // Ensure modal element exists before initializing
    if (sharedReportsModalEl) {
        // Initialize with backdrop: 'static' to prevent closing when clicking outside
        sharedReportsModal = new bootstrap.Modal(sharedReportsModalEl, {
            backdrop: true,
            keyboard: true,
            focus: true
        });

        // Add event listeners for modal events
        sharedReportsModalEl.addEventListener('hidden.bs.modal', function() {
            // Clean up any modal-related elements that might be left behind
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();

            // Ensure body classes are removed
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            // Update unread count
            fetchUnreadBadgeCount();
        });

        // Handle ESC key press globally when modal is open
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && sharedReportsModalEl.classList.contains('show')) {
                closeSharedReportsModal();
            }
        });

        // Handle clicks on the backdrop
        $(document).on('click', '.modal-backdrop', function() {
            if (sharedReportsModalEl.classList.contains('show')) {
                closeSharedReportsModal();
            }
        });
    }

    // Store unread report IDs
    let unreadReportIds = [];

    // Function to fetch unread report count
    function fetchUnreadBadgeCount() {
        fetch('/dashboard/getUnreadReportCount')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
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
                } else {
                    console.warn('Failed to get unread report count:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching unread count:', error);
                // Continue execution despite error
            });
    }

    // Function to fetch unread report ID list
    function fetchUnreadReportIds() {
        // Use the new API endpoint to get the list of unread report IDs
        fetch('/dashboard/getUnreadReportIds')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'Success') {
                    unreadReportIds = data.unreadReportIds || [];
                } else {
                    console.warn('Failed to get unread report IDs:', data.message);
                    unreadReportIds = [];
                }
            })
            .catch(error => {
                console.error('Error fetching unread report IDs:', error);
                // Continue execution despite error
                unreadReportIds = [];
            });
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

                        // Check if this report is unread - Use the unique reportId instead of senderID
                        const isUnread = unreadReportIds.includes(report.reportId);
                        const unreadDot = isUnread ?
                            '<span class="unread-dot position-absolute top-0 start-0 translate-middle p-1 bg-danger rounded-circle"></span>' : '';

                        const listItem = `
                            <li class="list-group-item shared-report-item position-relative ${isUnread ? 'unread-report' : ''}"
                                data-sender-id="${report.senderID}"
                                data-report-id="${report.reportId}">
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
                        e.preventDefault(); // Prevent any default button behavior
                        e.stopPropagation(); // Stop the event from bubbling up
                        const reportItem = $(this).closest('.shared-report-item');
                        const senderID = reportItem.data('sender-id');
                        const reportId = reportItem.data('report-id');
                        viewSharedReport(senderID, reportId);
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
    function viewSharedReport(senderID, reportId) {
        // First, close the modal to prevent UI issues
        closeSharedReportsModal();

        // Remove from unread list
        const index = unreadReportIds.indexOf(reportId);
        if (index > -1) {
            unreadReportIds.splice(index, 1);
        }

        // Mark report as read on server (non-blocking)
        // Ensure reportId is a string and not empty
        const validReportId = String(reportId || '').trim();
        if (!validReportId) {
            console.warn('Invalid reportId, skipping markReportAsRead');
            return;
        }

        fetch('/dashboard/markReportAsRead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportId: validReportId })
        })
        .then(response => {
            if (!response.ok) {
                console.warn(`Error marking report as read: ${response.status}`);
                return { status: 'Failed' };
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'Success') {
                fetchUnreadBadgeCount();
                $(`.shared-report-item[data-report-id="${reportId}"]`)
                    .removeClass('unread-report')
                    .find('.unread-dot')
                    .remove();
            }
        })
        .catch(error => console.error('Error marking report as read:', error));

        // Fetch the full shared report data
        console.log(`Fetching report with senderID: ${senderID}, reportId: ${reportId}`);

        fetch('/dashboard/getReport', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userID: senderID || 1,  // Changed to userID to match backend
                date: reportId || new Date().toISOString().split('T')[0]  // Changed to date to match backend
            })
        })
        .then(response => {
            if (!response.ok) {
                console.warn(`Error fetching report: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'Success' && data.reportHtml) {
                // Open the report HTML in a new tab
                const newTab = window.open('', '_blank');
                newTab.document.write(data.reportHtml);
                newTab.document.close();
            } else {
                showAlert('Failed to load report: ' + (data.message || 'Unknown error'), 'danger');
            }
        })
        .catch(error => {
            console.error('Error fetching shared report:', error);
            showAlert('Error loading report: ' + (error.message || 'Unknown error'), 'danger');
        });
    }

    // Click handler for 'Shared with me' button
    $('#sharedWithMeBtn').on('click', function() {
        // Only proceed if modal is properly initialized
        if (sharedReportsModal) {
            fetchSharedReportsList();

            try {
                // Show the modal
                sharedReportsModal.show();

                // Ensure the close button works properly
                $('.modal-footer .btn-secondary, .modal-header .btn-close').off('click').on('click', function() {
                    closeSharedReportsModal();
                });
            } catch (error) {
                console.error('Error showing shared reports modal:', error);
                // Try to recover by reinitializing the modal
                if (sharedReportsModalEl) {
                    sharedReportsModal = new bootstrap.Modal(sharedReportsModalEl);
                    sharedReportsModal.show();
                }
            }
        } else {
            console.error('Shared reports modal not initialized');
            // Try to initialize it now
            if (sharedReportsModalEl) {
                sharedReportsModal = new bootstrap.Modal(sharedReportsModalEl);
                sharedReportsModal.show();
            }
        }
    });

    // Function to safely close the shared reports modal
    function closeSharedReportsModal() {
        try {
            if (sharedReportsModal) {
                sharedReportsModal.hide();
            }

            // Manual cleanup in case the event listener doesn't trigger
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();

            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            // Update unread count
            fetchUnreadBadgeCount();
        } catch (error) {
            console.error('Error closing shared reports modal:', error);
            // Force cleanup
            $('.modal-backdrop').remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    }

    // Initial load and periodic refresh
    fetchUnreadBadgeCount();
    fetchUnreadReportIds();
    setInterval(fetchUnreadBadgeCount, 5 * 60 * 1000); // every 5 minutes
});