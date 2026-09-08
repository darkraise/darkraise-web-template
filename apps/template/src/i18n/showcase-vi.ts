import type { showcaseEnglish } from "./showcase-en"

export const showcaseVietnamese: Record<keyof typeof showcaseEnglish, string> =
  {
    "Collapsible content sections for progressive disclosure of information.":
      "Các phần nội dung có thể thu gọn để hiển thị thông tin từng bước.",
    "Modal dialogs that interrupt the user and require an explicit confirmation or cancellation.":
      "Hộp thoại ngắt thao tác và yêu cầu người dùng xác nhận hoặc hủy rõ ràng.",
    "Inline status banner with a leading icon, title, and description. Use for page-level notices, validation summaries, or status callouts.":
      "Thông báo trạng thái tại chỗ với biểu tượng, tiêu đề và mô tả. Dùng cho thông báo cấp trang, tổng hợp lỗi biểu mẫu hoặc trạng thái cần lưu ý.",
    "A circular slider for picking an angle in degrees. Drag the thumb or use the arrow keys to adjust.":
      "Thanh trượt dạng tròn để chọn góc theo độ. Kéo nút hoặc dùng phím mũi tên để điều chỉnh.",
    "Motion utilities for loading states, enter transitions, and attention cues.":
      "Hiệu ứng chuyển động cho trạng thái tải, chuyển tiếp khi xuất hiện và thu hút sự chú ý.",
    "Constrain a child to a specific width-to-height ratio. The ratio holds at any container width via a padding-bottom percentage trick.":
      "Giới hạn phần tử con theo tỷ lệ chiều rộng và chiều cao. Tỷ lệ được giữ ở mọi chiều rộng vùng chứa bằng phần trăm khoảng đệm phía dưới.",
    "User profile image with automatic initials fallback when the image is unavailable.":
      "Ảnh đại diện tự động thay bằng chữ cái đầu khi không có ảnh.",
    "Twelve predefined animated, interactive backgrounds for full-page screens like sign-in and registration. Every variant tracks the active theme and preset, reacts to the pointer, and falls back to a still composition when the visitor prefers reduced motion.":
      "Mười hai nền toàn trang có chuyển động và tương tác cho màn hình đăng nhập hoặc đăng ký. Mỗi biến thể theo giao diện hiện tại, phản hồi con trỏ và chuyển sang hình tĩnh khi người dùng chọn giảm chuyển động.",
    "Compact inline labels for status, categories, and counts.":
      "Nhãn nhỏ gọn cho trạng thái, danh mục và số lượng.",
    "Full-width status messages. Five severity variants plus an optional dismissible mode.":
      "Thông báo toàn chiều rộng với năm mức độ và tùy chọn cho phép đóng.",
    "Hierarchical navigation showing the path to the current page.":
      "Điều hướng phân cấp thể hiện đường dẫn đến trang hiện tại.",
    "Visually-joined set of buttons. The group shares a single border and merges the rounded corners so the buttons read as one segmented control.":
      "Nhóm nút liền nhau dùng chung đường viền và các góc bo, tạo thành một điều khiển phân đoạn.",
    "Interactive trigger elements with multiple visual variants, sizes, and states.":
      "Phần tử kích hoạt tương tác với nhiều biến thể hiển thị, kích thước và trạng thái.",
    "Date and date-range selection with keyboard navigation":
      "Chọn ngày và khoảng ngày bằng bàn phím",
    "Container with optional header, content, and footer regions for grouping related information.":
      "Vùng chứa với phần đầu, nội dung và chân tùy chọn để nhóm thông tin liên quan.",
    "Horizontal slider with previous / next controls and keyboard navigation. Pair with CarouselIndicatorGroup for dot pagination.":
      "Thanh trượt ngang với nút trước, sau và điều hướng bằng bàn phím. Kết hợp CarouselIndicatorGroup để phân trang bằng chấm.",
    "A column-based picker for choosing a value from a hierarchy of options. Hovering a parent reveals its children in the next column.":
      "Bộ chọn theo cột để chọn giá trị trong cây tùy chọn. Di chuột lên mục cha để hiện các mục con ở cột tiếp theo.",
    "Area, Bar, Line, and Pie charts built on Recharts via the shadcn chart system. Wrap any chart in ChartCard for a titled container.":
      "Biểu đồ Area, Bar, Line và Pie sử dụng Recharts thông qua hệ thống biểu đồ shadcn. Bọc biểu đồ trong ChartCard để thêm vùng chứa có tiêu đề.",
    "Two-state and indeterminate boolean input. Pair with a Label for accessible click targets.":
      "Ô nhập đúng hoặc sai với trạng thái chưa xác định. Kết hợp Label để tạo vùng nhấp hỗ trợ truy cập.",
    "Copy text to the clipboard with built-in success feedback and an auto-revert timeout.":
      "Sao chép văn bản vào bảng nhớ tạm với thông báo thành công và tự trở về trạng thái ban đầu sau một khoảng thời gian.",
    "An interactive component that shows or hides content on demand.":
      "Thành phần tương tác để hiển thị hoặc ẩn nội dung theo nhu cầu.",
    "A hex color picker that composes Popover, Input, and react-colorful's saturation/hue surface. Swatch presets, eye-dropper, and embedded layouts are supported.":
      "Bộ chọn màu hex kết hợp Popover, Input và vùng chọn độ bão hòa, sắc độ của react-colorful. Hỗ trợ bảng màu sẵn, lấy màu từ màn hình và bố cục nhúng.",
    "A searchable input paired with a listbox dropdown. Consumer drives filtering, supports keyboard navigation, async loading, and multi-select.":
      "Ô tìm kiếm kết hợp danh sách thả xuống. Ứng dụng điều khiển việc lọc; hỗ trợ bàn phím, tải bất đồng bộ và chọn nhiều mục.",
    "Searchable command palette with grouped results. Typically triggered with ⌘K.":
      "Bảng lệnh có tìm kiếm và nhóm kết quả, thường mở bằng ⌘K.",
    "Right-click anchored menu. Same item primitives as DropdownMenu but triggered by the platform contextmenu event (right-click on desktop, long-press on touch).":
      "Menu gắn tại vị trí nhấp phải. Dùng chung các mục với DropdownMenu nhưng mở bằng sự kiện contextmenu: nhấp phải trên máy tính hoặc nhấn giữ trên màn hình cảm ứng.",
    "Calendar heatmap of daily activity, with month labels, a legend, tooltips, keyboard navigation, three sizes, and seventeen colour variants.":
      "Lịch nhiệt thể hiện hoạt động hằng ngày với nhãn tháng, chú giải, gợi ý, điều hướng bàn phím, ba kích thước và mười bảy biến thể màu.",
    "High-level metric cards, KPI displays, progress indicators, and activity feeds.":
      "Thẻ chỉ số, hiển thị KPI, chỉ báo tiến trình và danh sách hoạt động.",
    "Feature-rich table built on TanStack Table with column sorting, text search, and pagination.":
      "Bảng dữ liệu dựa trên TanStack Table với sắp xếp cột, tìm kiếm văn bản và phân trang.",
    "Three independent numeric segments for entering a date. Supports year-month-day, month-day-year, and day-month-year formats with arrow-key adjustments and per-segment validation.":
      "Ba phần số độc lập để nhập ngày. Hỗ trợ thứ tự năm-tháng-ngày, tháng-ngày-năm và ngày-tháng-năm, điều chỉnh bằng phím mũi tên và kiểm tra từng phần.",
    "A date input with a calendar popover. Composes Popover, Input, and Calendar with single-date plus range plus preset support.":
      "Ô nhập ngày với lịch bật lên. Kết hợp Popover, Input và Calendar, hỗ trợ ngày đơn, khoảng ngày và cấu hình sẵn.",
    "Modal dialogs, side sheets, anchored popovers, and hover tooltips.":
      "Hộp thoại, bảng bên, vùng nổi gắn với phần tử và gợi ý khi di chuột.",
    "Button that downloads a Blob or string as a file. The component handles URL.createObjectURL + an anchor click + revocation so consumers only pass the data and a filename.":
      "Nút tải Blob hoặc chuỗi dưới dạng tệp. Thành phần quản lý URL.createObjectURL, nhấp liên kết và thu hồi URL; ứng dụng chỉ cần truyền dữ liệu và tên tệp.",
    "A panel that slides in from the bottom of the screen, built on Vaul.":
      "Bảng trượt lên từ cạnh dưới màn hình, xây dựng trên Vaul.",
    "Context menus with action items, checkboxes, radio groups, and nested submenus.":
      "Menu ngữ cảnh với mục thao tác, hộp kiểm, nhóm lựa chọn và menu con lồng nhau.",
    "Click-to-edit text with separate preview and edit states. Generic over the value type — wire it to a textarea, number input, tags array, or any custom widget via a slot that consumes useEditableContext().":
      "Nhấp để sửa văn bản với trạng thái xem trước và chỉnh sửa riêng. Kiểu giá trị linh hoạt: kết nối vùng văn bản, ô số, mảng thẻ hoặc điều khiển tùy chỉnh qua vùng dùng useEditableContext().",
    "A stateless primitive for telling people why a region has no content and what to do next.":
      "Thành phần không giữ trạng thái để giải thích vì sao vùng nội dung trống và gợi ý bước tiếp theo.",
    "Full-screen error states for 404, 500, error boundaries, and maintenance mode. Built on a shared ErrorLayout component.":
      "Màn hình lỗi toàn trang cho 404, 500, lỗi ứng dụng và chế độ bảo trì, dùng chung thành phần ErrorLayout.",
    "Toast notifications and inline alert patterns for communicating status to users.":
      "Thông báo nổi và cảnh báo tại chỗ để thông báo trạng thái cho người dùng.",
    "Vertical label+control wrapper used as the layout primitive for form controls. Use FieldLabel for the visible label and place any Input, Textarea, Select, or custom control inside.":
      "Vùng chứa nhãn và điều khiển theo chiều dọc cho biểu mẫu. Dùng FieldLabel làm nhãn và đặt Input, Textarea, Select hoặc điều khiển tùy chỉnh bên trong.",
    "Semantic <fieldset> wrapper with a styled legend. Setting disabled on the fieldset propagates to every nested form control via the native HTML behaviour.":
      "Thẻ <fieldset> có ngữ nghĩa với chú giải được tạo kiểu. Thuộc tính disabled vô hiệu hóa mọi trường lồng bên trong theo hành vi HTML gốc.",
    "Drag-and-drop file input with previews, validation, and multi-file support.":
      "Ô tải tệp bằng kéo thả với xem trước, kiểm tra hợp lệ và hỗ trợ nhiều tệp.",
    "An absolutely positioned panel you can drag from its header and resize from any border edge or corner. Optional drag handle, title, minimize / maximize / close triggers compose into a familiar window-chrome layout.":
      "Bảng định vị tuyệt đối có thể kéo từ phần đầu và đổi kích thước từ cạnh hoặc góc. Tay nắm, tiêu đề và nút thu nhỏ, phóng to, đóng tạo nên giao diện cửa sổ quen thuộc.",
    "TanStack Form–integrated field components with built-in validation, labels, and error display.":
      "Trường biểu mẫu tích hợp TanStack Form với kiểm tra hợp lệ, nhãn và hiển thị lỗi.",
    "An iframe wrapper that lets you render React children inside a fully isolated document. Useful for sandboxing styles, previewing email templates, or embedding untrusted markup.":
      "Vùng iframe để hiển thị phần tử React trong tài liệu tách biệt. Hữu ích khi cô lập kiểu giao diện, xem trước mẫu email hoặc nhúng nội dung đánh dấu.",
    "Mark substrings inside a body of text with a literal-string matcher. Pure rendering — no state, no machine, just split-and-wrap.":
      "Tô sáng chuỗi con bằng cách so khớp văn bản trực tiếp. Chỉ xử lý hiển thị bằng tách và bọc nội dung, không có trạng thái hay bộ máy điều khiển.",
    "A card that appears when hovering over a trigger element, for non-interactive preview content.":
      "Thẻ xuất hiện khi di chuột lên phần tử kích hoạt, dành cho nội dung xem trước không tương tác.",
    "Icon primitives from lucide-react. Browse the full catalog or learn the usage conventions used throughout this template.":
      "Biểu tượng từ lucide-react. Duyệt toàn bộ danh mục hoặc tìm hiểu quy ước sử dụng trong mẫu ứng dụng.",
    "A compound primitive for cropping and orienting an image. Drag the selection to move, drag the eight handles to resize, drag the bare viewport to pan, wheel or pinch to zoom, arrow keys to nudge.":
      "Thành phần ghép để cắt và định hướng ảnh. Kéo vùng chọn để di chuyển, kéo tám tay nắm để đổi kích thước, kéo vùng trống để di chuyển ảnh, cuộn hoặc chụm để phóng, dùng phím mũi tên để dịch từng bước.",
    "Composes ImageCropper with a filter chain, named presets, free-rotate, undo/redo, a tool switcher, and getEditedImage(). Includes annotation, freeform selection, and perspective correction.":
      "Kết hợp ImageCropper với chuỗi bộ lọc, cấu hình có tên, xoay tự do, hoàn tác/làm lại, chuyển công cụ và getEditedImage(). Bao gồm chú thích, vùng chọn tự do và hiệu chỉnh phối cảnh.",
    "One-time-password field — a row of single-character slots with paste support and arrow-key navigation. Often grouped into two halves with a visual separator.":
      "Ô mật khẩu dùng một lần gồm các vị trí ký tự, hỗ trợ dán và phím mũi tên. Thường chia thành hai nhóm bằng dấu phân cách.",
    "Form control primitives: text input, textarea, select, checkbox, switch, and radio group.":
      "Các điều khiển biểu mẫu: ô văn bản, vùng văn bản, danh sách chọn, hộp kiểm, công tắc và nhóm lựa chọn.",
    "A read-only viewer for nested JSON data. Independently expandable rows, type-coloured values, search and expand-all toolbar, per-row Copy path and Copy value actions, container previews when collapsed, smart rendering for URLs and colours, and keyboard navigation.":
      "Trình xem JSON lồng nhau chỉ đọc với từng dòng mở rộng độc lập, màu theo kiểu, tìm kiếm, mở rộng tất cả, sao chép đường dẫn và giá trị, xem trước vùng thu gọn, xử lý URL, màu sắc và điều hướng bàn phím.",
    "Inline keyboard key indicator. Use to label shortcuts in help text, command palettes, and onboarding copy.":
      "Ký hiệu phím trong dòng văn bản để mô tả phím tắt trong hướng dẫn, bảng lệnh và nội dung giới thiệu.",
    "Accessible label primitive. Use htmlFor to associate it with a control by id so click and screen-reader focus both forward to the input.":
      "Nhãn hỗ trợ truy cập. Dùng htmlFor liên kết với id của điều khiển để chuyển thao tác nhấp và tiêu điểm trình đọc màn hình đến ô nhập.",
    "Full-page layout shells for structuring your application. Each variant suits different navigation complexity and content patterns.":
      "Bố cục toàn trang để tổ chức ứng dụng. Mỗi biến thể phù hợp với mức độ phức tạp của điều hướng và kiểu nội dung khác nhau.",
    "Keyboard-navigable list of options. Supports single and multi-selection with arrow keys, Home, End, and typeahead.":
      "Danh sách tùy chọn điều hướng bằng bàn phím. Hỗ trợ chọn một hoặc nhiều mục bằng phím mũi tên, Home, End và tìm theo ký tự gõ.",
    "Horizontally scrolling row of content. The component duplicates its children so the loop is seamless, and supports pause-on-hover plus reversed direction.":
      "Dải nội dung cuộn ngang. Thành phần nhân đôi phần tử con để lặp liền mạch, hỗ trợ dừng khi di chuột và đảo chiều.",
    "Application-style menu bar — a row of top-level menus that open dropdowns. Use for desktop-style toolbars; once a menu is open, hovering siblings switches between them without re-clicking.":
      "Thanh menu kiểu ứng dụng với các menu chính mở danh sách thả xuống. Khi một menu đang mở, di chuột sang mục bên cạnh để chuyển menu mà không cần nhấp lại.",
    "Combobox-based picker for choosing many items from a predefined catalog. Renders the picked items as removable chips inside the trigger and keeps the panel open across selections.":
      "Bộ chọn dựa trên Combobox để chọn nhiều mục từ danh mục có sẵn. Hiển thị các mục đã chọn thành thẻ có thể xóa và giữ bảng mở giữa các lần chọn.",
    "Top-level site navigation with optional dropdown content. Each item is either a direct link or a trigger that opens a content panel below the bar.":
      "Điều hướng chính của trang với nội dung thả xuống tùy chọn. Mỗi mục là liên kết trực tiếp hoặc nút mở bảng nội dung bên dưới.",
    "Numeric input with steppers, keyboard support, locale formatting, and min/max clamp on blur.":
      "Ô nhập số với nút tăng giảm, bàn phím, định dạng theo ngôn ngữ và giới hạn tối thiểu, tối đa khi rời ô.",
    "Navigation controls for paginated content.":
      "Các điều khiển điều hướng cho nội dung được phân trang.",
    "Composition over the input primitive that adds an eye-toggle to reveal or hide the value.":
      "Mở rộng ô nhập bằng nút hình mắt để hiện hoặc ẩn mật khẩu.",
    "Anchored floating panel for short forms, secondary actions, and contextual content. Closes on outside click and Escape by default.":
      "Vùng nổi gắn với phần tử kích hoạt cho biểu mẫu ngắn, thao tác phụ và nội dung ngữ cảnh. Mặc định đóng khi nhấp bên ngoài hoặc nhấn Escape.",
    "Horizontal progress bar with value and animation support.":
      "Thanh tiến trình ngang hỗ trợ giá trị và chuyển động.",
    "An SVG QR code generator that wraps react-qr-code. Supports four error-correction levels, theme-aware foreground via currentColor, and an absolutely-centered overlay slot for logos.":
      "Tạo mã QR dạng SVG bằng react-qr-code. Hỗ trợ bốn mức sửa lỗi, màu theo giao diện qua currentColor và vùng logo đặt chính giữa.",
    "Exclusive selection across two or more options. The group owns the value; each RadioGroupItem provides one choice.":
      "Chọn duy nhất một trong từ hai tùy chọn trở lên. Nhóm quản lý giá trị; mỗi RadioGroupItem cung cấp một lựa chọn.",
    "Star rating control with hover preview, optional half-star precision, and full keyboard support. Modeled as an ARIA radio group.":
      "Đánh giá bằng sao với xem trước khi di chuột, độ chính xác nửa sao tùy chọn và hỗ trợ bàn phím, theo mô hình nhóm radio ARIA.",
    "Split-panel container with draggable dividers. Each panel takes a defaultSize (percentage) and reflows when the user drags a handle.":
      "Vùng chia bảng với đường phân cách có thể kéo. Mỗi bảng nhận defaultSize theo phần trăm và thay đổi khi người dùng kéo tay nắm.",
    "A scrollable container with a consistently styled custom scrollbar across platforms.":
      "Vùng cuộn với thanh cuộn tùy chỉnh có kiểu hiển thị nhất quán giữa các nền tảng.",
    "iOS-style segmented control with an animated indicator pill that slides between selected items. Built atop the RadioGroup primitive.":
      "Điều khiển phân đoạn kiểu iOS với chỉ báo hình viên thuốc trượt giữa các mục, xây dựng trên RadioGroup.",
    "Native-feeling single-select dropdown with keyboard navigation and search-by-letter. Use Combobox or VirtualizedDropdownMenu when the option list is large or filterable.":
      "Danh sách thả xuống chọn một mục với bàn phím và tìm theo ký tự. Dùng Combobox hoặc VirtualizedDropdownMenu cho danh sách lớn hoặc cần lọc.",
    "Horizontal and vertical visual dividers for separating content regions.":
      "Đường phân cách ngang và dọc để tách các vùng nội dung.",
    "Edge-anchored modal panel — slides in from the left, right, top, or bottom. Use for contextual detail views, settings panels, and side forms.":
      "Bảng hộp thoại gắn cạnh, trượt từ trái, phải, trên hoặc dưới. Dùng cho chi tiết ngữ cảnh, bảng cài đặt và biểu mẫu bên.",
    "One theme axis, six chrome treatments, each composing with all four shell structures. Switch the axis in the theme panel to move every shell in the app at once, or pin one shell with the shellStyle prop.":
      "Một trục giao diện với sáu kiểu khung, kết hợp cùng cả bốn cấu trúc bố cục. Chuyển trong bảng giao diện để đổi toàn ứng dụng hoặc đặt shellStyle cho một bố cục riêng.",
    "A canvas-based signature primitive with pointer-event drawing, imperative clear and export, and customizable stroke styling.":
      "Vùng ký tên trên canvas với thao tác con trỏ, lệnh xóa và xuất, cùng kiểu nét tùy chỉnh.",
    "Animated loading placeholders that mimic the shape of the content they replace.":
      "Khung chờ tải có chuyển động mô phỏng hình dạng nội dung sẽ xuất hiện.",
    "An input for selecting a numeric value within a given range.":
      "Ô chọn giá trị số trong một khoảng cho trước.",
    "Indeterminate loading indicator. Three sizes and three variants — pick by surface contrast.":
      "Chỉ báo đang tải với ba kích thước và ba biến thể để phù hợp độ tương phản của bề mặt.",
    "KPI block — a labelled metric value with an optional change indicator. Usually shown in a grid to compare a few headline numbers at a glance.":
      "Khối KPI với nhãn, giá trị và chỉ báo thay đổi tùy chọn. Thường đặt theo lưới để so sánh nhanh các chỉ số chính.",
    "Wizard / stepper with content slots, linear gating, vertical orientation, and roving keyboard focus.":
      "Quy trình từng bước với vùng nội dung, điều kiện chuyển bước, hướng dọc và di chuyển tiêu điểm bằng bàn phím.",
    "Crossfade between two children based on a boolean state. Pure presentation — wrap in a button to make it interactive.":
      "Chuyển mờ giữa hai phần tử theo giá trị đúng hoặc sai. Chỉ xử lý hiển thị; bọc trong nút để tạo tương tác.",
    "Two-state toggle for immediate, reversible settings — preferred over a Checkbox when the change applies on flip rather than on form submission.":
      "Công tắc hai trạng thái cho thiết lập có hiệu lực ngay và có thể đảo ngược. Dùng thay Checkbox khi thay đổi áp dụng ngay lúc bật tắt.",
    "Semantic HTML table with various patterns: basic, scrollable, sticky headers, pagination, sorting, selection, and filtering.":
      "Bảng HTML có ngữ nghĩa với các mẫu cơ bản, cuộn, đầu bảng cố định, phân trang, sắp xếp, chọn và lọc.",
    "Organize related content into switchable panels within the same page context.":
      "Tổ chức nội dung liên quan thành các bảng có thể chuyển đổi trong cùng trang.",
    "A chip-based input for entering multiple tagged values. Supports delimiters, validation, paste splitting, max-count, and form serialization.":
      "Ô nhập nhiều giá trị dạng thẻ. Hỗ trợ ký tự phân cách, kiểm tra hợp lệ, tách khi dán, giới hạn số lượng và dữ liệu biểu mẫu.",
    "Multi-line text input. Supports a trailingAction slot for adornments like a clear button, character count, or send action.":
      "Ô văn bản nhiều dòng. Vùng trailingAction hỗ trợ nút xóa, bộ đếm ký tự hoặc thao tác gửi.",
    "HH:MM time input. Pair with a DatePicker / Calendar when both date and time are needed.":
      "Ô nhập thời gian HH:MM. Kết hợp DatePicker hoặc Calendar khi cần cả ngày và giờ.",
    "Chronological event rail with status, timestamps, and an alternating layout.":
      "Dòng sự kiện theo thời gian với trạng thái, mốc thời gian và bố cục xen kẽ.",
    "Display elapsed or remaining time with start, pause, resume, and reset controls.":
      "Hiển thị thời gian đã qua hoặc còn lại với bắt đầu, tạm dừng, tiếp tục và đặt lại.",
    "Stateful button primitives for single and multi-select toolbar interactions.":
      "Các nút có trạng thái cho thao tác chọn một hoặc nhiều mục trên thanh công cụ.",
    "Compact strip of buttons and toggles with optional separators. Use for editor formatting bars, table-action rows, or inspector controls.":
      "Dải nút và công tắc nhỏ gọn với đường phân cách tùy chọn. Dùng cho định dạng văn bản, thao tác bảng hoặc bảng kiểm tra thuộc tính.",
    "Short hover/focus label. Mount a single TooltipProvider at the page or app root, then wrap each trigger in a Tooltip.":
      "Nhãn ngắn khi di chuột hoặc đặt tiêu điểm. Đặt một TooltipProvider ở cấp trang hoặc ứng dụng, rồi bọc mỗi phần tử kích hoạt bằng Tooltip.",
    "A guided walkthrough that highlights elements with a spotlight and shows a step popover. Targets are matched by CSS selector so the host page does not need refs.":
      "Hướng dẫn từng bước làm nổi bật phần tử và hiển thị nội dung nổi. Tìm phần tử bằng bộ chọn CSS để trang không cần cung cấp ref.",
    "Recursive tree with expansion, selection, roving keyboard focus, and ARIA tree semantics.":
      "Cây đệ quy với mở rộng, chọn mục, di chuyển tiêu điểm bằng bàn phím và ngữ nghĩa cây ARIA.",
    "Drop-in alternative to DropdownMenu that renders only the visible rows. Use when the option list is too large to mount eagerly — autocomplete catalogs, country pickers, log entries.":
      "Thay thế DropdownMenu bằng cách chỉ hiển thị các dòng đang nhìn thấy. Dùng khi danh sách quá lớn để dựng toàn bộ, như danh mục gợi ý, quốc gia hoặc nhật ký.",
    "Date-bucketed scroller for collections too large to render, with a draggable scrubber, lazy loading, selection, collapse, and jump-to-date.":
      "Cuộn theo nhóm ngày cho dữ liệu quá lớn để hiển thị toàn bộ, với thanh điều hướng có thể kéo, tải khi cần, chọn mục, thu gọn và chuyển đến ngày.",
    'type="single" — only one item open at a time':
      'type="single" — chỉ mở một mục mỗi lần',
    "Variant x elevation": "Biến thể × độ nổi",
    Border: "Viền",
    Orientation: "Hướng",
    'type="multiple" — any number of items open simultaneously':
      'type="multiple" — mở đồng thời nhiều mục',
    "FAQ pattern": "Mẫu câu hỏi thường gặp",
    "Triggers with icons and badges": "Nút mở với biểu tượng và nhãn",
    "Nested accordion — hierarchical content":
      "Accordion lồng nhau — nội dung phân cấp",
    "Settings-style accordion with form controls":
      "Accordion dạng cài đặt với trường biểu mẫu",
    "Basic alert dialog": "Hộp thoại cảnh báo cơ bản",
    "Destructive confirmation": "Xác nhận thao tác xóa",
    "Custom content with detailed description":
      "Nội dung tùy chỉnh với mô tả chi tiết",
    Variants: "Biến thể",
    Dismissible: "Cho phép đóng",
    "Default (uncontrolled)": "Mặc định (không kiểm soát)",
    "Controlled with value display": "Kiểm soát giá trị và hiển thị",
    Disabled: "Vô hiệu hóa",
    "Spin — continuous rotation for loaders": "Spin — xoay liên tục khi tải",
    "Pulse — opacity fade for skeleton content":
      "Pulse — nhấp nháy độ mờ cho khung chờ tải",
    "Pulse subtle — custom 2s loop for idle state":
      "Pulse nhẹ — vòng lặp 2 giây cho trạng thái chờ",
    "Bounce — vertical hop for attention dots":
      "Bounce — nhảy dọc để thu hút chú ý",
    "Ping — radar pulse for live indicators":
      "Ping — xung radar cho chỉ báo trực tiếp",
    "Slide — 1.2s horizontal shimmer":
      "Slide — ánh sáng lướt ngang trong 1,2 giây",
    "Enter animations — fade / zoom / slide-in on mount":
      "Hiệu ứng xuất hiện — mờ dần, phóng hoặc trượt khi hiển thị",
    "Hover transforms — scale, rotate, translate":
      "Biến đổi khi di chuột — tỷ lệ, xoay và dịch chuyển",
    "Color and opacity transitions": "Chuyển tiếp màu và độ mờ",
    "16:9 container": "Vùng chứa 16:9",
    "Square (1:1)": "Hình vuông (1:1)",
    "Portrait (9:16)": "Chiều dọc (9:16)",
    "Sizes with initials fallback": "Kích thước với chữ cái đầu thay thế",
    "With image (falling back to initials on broken src)":
      "Có ảnh (thay bằng chữ cái đầu khi src lỗi)",
    "Avatar group (stacked)": "Nhóm ảnh đại diện xếp chồng",
    "Online status dot": "Chấm trạng thái trực tuyến",
    "Group with +N overflow": "Nhóm với chỉ báo +N mục còn lại",
    "Avatar with tooltip": "Ảnh đại diện với gợi ý",
    "Full-page usage — wrap an auth screen":
      "Dùng toàn trang — bọc màn hình đăng nhập",
    "Tuning factors — drag to adjust speed, density, intensity":
      "Thông số điều chỉnh — kéo để đổi tốc độ, mật độ và cường độ",
    "Variant x size": "Biến thể × kích thước",
    "With icons": "Có biểu tượng",
    "Numeric count badges": "Nhãn đếm số lượng",
    "In context — order status": "Trong ngữ cảnh — trạng thái đơn hàng",
    "Closable badges": "Nhãn có thể đóng",
    "Animated pulse dot": "Chấm nhấp nháy",
    "Badge list (tag cloud)": "Danh sách nhãn",
    "Anchored over a parent (Material-style)":
      "Gắn lên phần tử cha theo kiểu Material",
    "Anchor position": "Vị trí gắn",
    "Badge in table context": "Nhãn trong bảng dữ liệu",
    "Basic breadcrumb": "Đường dẫn cơ bản",
    "Custom separator": "Dấu phân cách tùy chỉnh",
    "Truncated with ellipsis": "Rút gọn bằng dấu ba chấm",
    "Loading state": "Trạng thái tải",
    "Disabled state": "Trạng thái vô hiệu hóa",
    "Split button": "Nút chia đôi",
    "Icon toolbar": "Thanh công cụ biểu tượng",
    "Toggle button bar": "Thanh nút bật tắt",
    "Basic calendar": "Lịch cơ bản",
    "Range calendar": "Lịch chọn khoảng ngày",
    "Month and year selector": "Chọn tháng và năm",
    "Year and decade zoom — click the caption to zoom out":
      "Chọn năm và thập kỷ — nhấp tiêu đề để thu nhỏ",
    Presets: "Cấu hình sẵn",
    "Date and time picker": "Chọn ngày và giờ",
    "Custom cell size": "Kích thước ô tùy chỉnh",
    "Week numbers": "Số tuần",
    "Date picker in popover": "Chọn ngày trong vùng nổi",
    "Date range picker in popover": "Chọn khoảng ngày trong vùng nổi",
    "Date of birth picker": "Chọn ngày sinh",
    "Default card": "Thẻ mặc định",
    "Content-only card": "Thẻ chỉ có nội dung",
    "Divided card": "Thẻ chia phần",
    "Border x elevation": "Viền × độ nổi",
    "Surface intensity": "Cường độ bề mặt",
    "Elevation prop": "Thuộc tính elevation",
    "Header with badge": "Phần đầu với nhãn",
    "Header with action menu": "Phần đầu với menu thao tác",
    "Stat summary": "Tổng hợp chỉ số",
    "Pricing tier": "Gói giá",
    "Interactive (clickable) card": "Thẻ tương tác có thể nhấp",
    "Media card": "Thẻ nội dung đa phương tiện",
    "User profile": "Hồ sơ người dùng",
    "Notification card": "Thẻ thông báo",
    "Horizontal card slider": "Thanh trượt thẻ ngang",
    "With indicators (dot pagination)": "Có chỉ báo phân trang bằng chấm",
    "Read-only indicators (status only, not clickable)":
      "Chỉ báo chỉ đọc, không thể nhấp",
    Align: "Căn chỉnh",
    "Country and state": "Quốc gia và tiểu bang",
    "Three-level cascade": "Chọn phụ thuộc ba cấp",
    "With a disabled branch": "Có nhánh bị vô hiệu hóa",
    "AreaChart — filled area under a line": "AreaChart — vùng tô dưới đường",
    "BarChart — discrete category comparison":
      "BarChart — so sánh các danh mục riêng biệt",
    "LineChart — multiple series comparison":
      "LineChart — so sánh nhiều chuỗi dữ liệu",
    "PieChart — proportional distribution": "PieChart — phân bố theo tỷ lệ",
    "All four charts in a 2×2 grid": "Bốn biểu đồ trong lưới 2×2",
    "Period toggle — interactive date range selector":
      "Chuyển khoảng thời gian — chọn khoảng ngày tương tác",
    "Chart loading skeleton": "Khung chờ tải biểu đồ",
    "Chart empty state": "Trạng thái biểu đồ trống",
    States: "Trạng thái",
    Sizes: "Kích thước",
    "Copy a code snippet": "Sao chép đoạn mã",
    "Copy a long URL": "Sao chép URL dài",
    "Custom timeout with success-state pulse":
      "Thời gian tùy chỉnh với hiệu ứng thành công",
    "Show a toast on copy (default messages)":
      "Hiển thị thông báo khi sao chép (nội dung mặc định)",
    "Custom toast messages": "Nội dung thông báo tùy chỉnh",
    "Basic collapsible": "Thu gọn cơ bản",
    "Collapsible with rotating chevron icon":
      "Thu gọn với biểu tượng mũi tên xoay",
    '"Show more" list pattern': "Mẫu danh sách “Hiển thị thêm”",
    "Brand color with swatches": "Màu thương hiệu với bảng màu",
    "With eye-dropper": "Có công cụ lấy màu",
    "Embedded (no popover)": "Nhúng trực tiếp, không có vùng nổi",
    "Hex input field only": "Chỉ có ô nhập màu hex",
    "Country picker with filtering": "Chọn quốc gia có lọc",
    "Async-loading items with debounce":
      "Tải mục bất đồng bộ với trì hoãn nhập",
    "Multi-select with chip readout": "Chọn nhiều và hiển thị thẻ đã chọn",
    "Custom item rendering": "Hiển thị mục tùy chỉnh",
    "Basic command palette": "Bảng lệnh cơ bản",
    "With keyboard shortcuts": "Có phím tắt",
    "Recent searches dialog": "Hộp thoại tìm kiếm gần đây",
    "Async search results": "Kết quả tìm kiếm bất đồng bộ",
    "Basic actions": "Thao tác cơ bản",
    "Complex nested menu": "Menu lồng nhau nhiều cấp",
    Default: "Mặc định",
    "Week starts on Monday": "Tuần bắt đầu vào thứ Hai",
    "Grid only": "Chỉ có lưới",
    "Clickable cells": "Ô có thể nhấp",
    "Colour variants": "Biến thể màu",
    "StatCard — metric with icon and trend":
      "StatCard — chỉ số với biểu tượng và xu hướng",
    "KPICard — value with sparkline and comparison":
      "KPICard — giá trị với biểu đồ nhỏ và so sánh",
    "ProgressCard — value vs target": "ProgressCard — giá trị so với mục tiêu",
    "ActivityFeed — timestamped event list":
      "ActivityFeed — danh sách sự kiện có thời gian",
    "Metric comparison — period-over-period with badges":
      "So sánh chỉ số giữa các kỳ bằng nhãn",
    "Compact stat row — inline metrics in a single card":
      "Dòng chỉ số nhỏ gọn trong một thẻ",
    "Grid layout variations — 2, 3, and 4 column MetricGrid":
      "Biến thể bố cục MetricGrid gồm 2, 3 và 4 cột",
    "DataTable with sortable columns and search":
      "DataTable với sắp xếp cột và tìm kiếm",
    "With custom cell renderer (status badge)":
      "Ô hiển thị tùy chỉnh với nhãn trạng thái",
    "Expandable row detail": "Chi tiết dòng có thể mở rộng",
    "Bulk actions toolbar": "Thanh thao tác hàng loạt",
    "Faceted filters": "Bộ lọc theo thuộc tính",
    "Default (year-month-day)": "Mặc định (năm-tháng-ngày)",
    "Month-day-year (US)": "Tháng-ngày-năm (Mỹ)",
    "Day-month-year (EU) with external clear":
      "Ngày-tháng-năm (châu Âu) với nút xóa bên ngoài",
    "Single date with input mask": "Ngày đơn với mẫu nhập liệu",
    "Range with two-month view": "Khoảng ngày với hai tháng hiển thị",
    "With presets": "Có cấu hình sẵn",
    "Min/max constraints": "Giới hạn tối thiểu/tối đa",
    "Open on focus": "Mở khi đặt tiêu điểm",
    "Dialog — modal confirmation": "Dialog — hộp thoại xác nhận",
    "Sheet — side panel": "Sheet — bảng bên",
    "Popover — anchored floating panel": "Popover — bảng nổi gắn với phần tử",
    "Tooltip — hover label": "Tooltip — nhãn khi di chuột",
    "Dialog — multi-step wizard": "Dialog — quy trình nhiều bước",
    "Dialog — type-to-confirm deletion": "Dialog — nhập để xác nhận xóa",
    "Dialog — full-screen scrollable": "Dialog — toàn màn hình có thể cuộn",
    "Dialog — locked backdrop (no accidental dismiss)":
      "Dialog — khóa nền để tránh đóng nhầm",
    "Sheet — edit profile form": "Sheet — biểu mẫu sửa hồ sơ",
    "Sheet — locked backdrop while editing":
      "Sheet — khóa nền trong khi chỉnh sửa",
    "Sheet — scrollable content": "Sheet — nội dung có thể cuộn",
    "Text and JSON": "Văn bản và JSON",
    "Basic drawer": "Ngăn trượt cơ bản",
    "Drawer with form": "Ngăn trượt có biểu mẫu",
    "Scrollable drawer": "Ngăn trượt có thể cuộn",
    "Locked backdrop (no accidental dismiss)": "Khóa nền để tránh đóng nhầm",
    "Side x align": "Cạnh × căn chỉnh",
    "Basic menu with sections": "Menu cơ bản chia theo nhóm",
    "With checkboxes and radio groups": "Có hộp kiểm và nhóm lựa chọn",
    "Full menu with submenu": "Menu đầy đủ với menu con",
    "Context menu (right-click)": "Menu ngữ cảnh khi nhấp phải",
    "Dropdown with search": "Danh sách thả xuống có tìm kiếm",
    "Avatar-trigger dropdown": "Mở danh sách từ ảnh đại diện",
    "Virtualized dropdown (10,000 items)":
      "Danh sách thả xuống ảo hóa (10.000 mục)",
    "Inline title rename": "Đổi tiêu đề tại chỗ",
    "Submit on blur": "Lưu khi rời ô",
    "Multi-line bio (custom <textarea> slot)":
      "Tiểu sử nhiều dòng với vùng <textarea> tùy chỉnh",
    "Numeric count (Editable<number> + NumberInput)":
      "Bộ đếm số (Editable<number> + NumberInput)",
    "Skills (Editable<string[]> with chip preview)":
      "Kỹ năng (Editable<string[]> với thẻ xem trước)",
    "Explicit save and cancel": "Nút lưu và hủy riêng",
    "No results": "Không có kết quả",
    "Empty list": "Danh sách trống",
    "Generic blank": "Trạng thái trống chung",
    "Title only": "Chỉ có tiêu đề",
    "404 — Not found": "404 — Không tìm thấy",
    "Error boundary": "Xử lý lỗi",
    "500 — Server error": "500 — Lỗi máy chủ",
    Maintenance: "Bảo trì",
    "Custom error page": "Trang lỗi tùy chỉnh",
    "Toast variants": "Biến thể thông báo nổi",
    "Rich content (title + description + actions + close)":
      "Nội dung đầy đủ: tiêu đề, mô tả, thao tác và nút đóng",
    "Toast with action": "Thông báo có thao tác",
    "Toast with description": "Thông báo có mô tả",
    "Promise toast": "Thông báo theo Promise",
    "Toast with persistent close button": "Thông báo với nút đóng luôn hiện",
    "Toast position (per-toast or default)":
      "Vị trí thông báo: từng thông báo hoặc mặc định",
    "Toast with custom duration": "Thông báo có thời lượng tùy chỉnh",
    "Inline alert banner": "Biểu ngữ cảnh báo tại chỗ",
    "Dismissible inline alert": "Cảnh báo tại chỗ có thể đóng",
    "Progress feedback": "Thông báo tiến trình",
    "Single field": "Trường đơn",
    "Legend variant": "Biến thể chú giải",
    "Two-column grid": "Lưới hai cột",
    "Toggle disabled propagation": "Bật tắt việc vô hiệu hóa trường con",
    "Single image with preview": "Ảnh đơn với xem trước",
    "Multi-file with size limit": "Nhiều tệp với giới hạn kích thước",
    "With progress indicator": "Có chỉ báo tiến trình",
    "With chrome (drag handle, title, triggers)":
      "Có khung cửa sổ: tay nắm, tiêu đề và nút thao tác",
    "Scope: local (parent-bound)": "Phạm vi local: trong phần tử cha",
    "Scope: global (viewport-bound, multi-instance)":
      "Phạm vi global: trong màn hình, nhiều cửa sổ",
    "Scope: app (survives route changes)":
      "Phạm vi app: giữ lại khi chuyển trang",
    "Header-only (minimal)": "Chỉ có phần đầu tối giản",
    "Controlled position": "Vị trí được kiểm soát",
    "Pin in place": "Ghim tại chỗ",
    "TextField, TextareaField, NumberField, SelectField, SwitchField, RadioGroupField, CheckboxField":
      "TextField, TextareaField, NumberField, SelectField, SwitchField, RadioGroupField, CheckboxField",
    "Conditional Fields": "Trường có điều kiện",
    "Inline Edit": "Chỉnh sửa tại chỗ",
    "Dependent Selects": "Danh sách chọn phụ thuộc",
    Basic: "Cơ bản",
    "With head": "Có phần head",
    "Responsive viewport preview": "Xem trước màn hình thích ứng",
    "Email template preview": "Xem trước mẫu email",
    "Style isolation contrast": "So sánh việc cô lập kiểu giao diện",
    "Design system inside the frame": "Hệ thống thiết kế bên trong khung",
    "External site (cross-origin src)": "Trang bên ngoài với src khác nguồn",
    "Search-result highlighting": "Tô sáng kết quả tìm kiếm",
    "Multi-term highlighting": "Tô sáng nhiều cụm từ",
    "Case sensitivity comparison": "So sánh phân biệt chữ hoa và chữ thường",
    "User profile hover card": "Thẻ hồ sơ khi di chuột",
    "Product preview hover card": "Thẻ xem trước sản phẩm khi di chuột",
    "Colors via text tokens": "Màu qua token văn bản",
    "Stroke width": "Độ rộng nét",
    "Icon with text": "Biểu tượng kèm văn bản",
    Accessibility: "Khả năng truy cập",
    "Drag-and-drop file": "Kéo thả tệp",
    "Live dimensions badge": "Nhãn kích thước cập nhật trực tiếp",
    "Constrain selection to image": "Giới hạn vùng chọn trong ảnh",
    "Translations (French)": "Bản dịch tiếng Pháp",
    "Aspect ratio": "Tỷ lệ khung hình",
    Circle: "Hình tròn",
    "Initial crop": "Vùng cắt ban đầu",
    "Min / max selection size": "Kích thước vùng chọn tối thiểu/tối đa",
    "Fixed crop area": "Vùng cắt cố định",
    "Controlled zoom": "Mức phóng được kiểm soát",
    "Zoom limits": "Giới hạn phóng",
    Rotation: "Xoay",
    Flip: "Lật",
    Events: "Sự kiện",
    "Context (render-prop)": "Context qua render-prop",
    "Root provider": "Provider gốc",
    "Crop preview": "Xem trước vùng cắt",
    Reset: "Đặt lại",
    "Adjust panel": "Bảng điều chỉnh",
    "Adjust panel (separate instances)": "Bảng điều chỉnh với các phiên riêng",
    "Custom presets": "Cấu hình tùy chỉnh",
    "Tools switcher": "Chuyển công cụ",
    "Free-rotate": "Xoay tự do",
    "Status bar": "Thanh trạng thái",
    Annotation: "Chú thích",
    "Freeform selection": "Vùng chọn tự do",
    "Perspective correction": "Hiệu chỉnh phối cảnh",
    "Extensions (posterize stub)": "Phần mở rộng: mẫu posterize",
    "Undo / redo": "Hoàn tác / làm lại",
    "Export edited image": "Xuất ảnh đã chỉnh sửa",
    "Full editor": "Trình chỉnh sửa đầy đủ",
    "6-digit code": "Mã 6 chữ số",
    "4-digit code (no separator)": "Mã 4 chữ số không có dấu phân cách",
    Variant: "Biến thể",
    'Separate inputs (variant="separate")':
      'Ô nhập tách biệt (variant="separate")',
    "Text input states": "Trạng thái ô nhập văn bản",
    Textarea: "Vùng văn bản",
    Select: "Danh sách chọn",
    Checkbox: "Hộp kiểm",
    "Checkbox sizes": "Kích thước hộp kiểm",
    Switch: "Công tắc",
    "Radio Group": "Nhóm lựa chọn",
    "Radio group sizes": "Kích thước nhóm lựa chọn",
    "Input with button": "Ô nhập kèm nút",
    "Prefix / suffix": "Tiền tố / hậu tố",
    "Clearable input (trailingAction)": "Ô nhập có nút xóa (trailingAction)",
    "Password visibility toggle (trailingAction)":
      "Bật tắt hiển thị mật khẩu (trailingAction)",
    "Clearable textarea (trailingAction)":
      "Vùng văn bản có nút xóa (trailingAction)",
    "Character count textarea": "Vùng văn bản đếm ký tự",
    "API response with copy actions": "Phản hồi API với thao tác sao chép",
    "Toolbar — search and expand controls": "Thanh công cụ tìm kiếm và mở rộng",
    "Smart values — URLs, colours, long strings, empty containers":
      "Giá trị thông minh: URL, màu, chuỗi dài và vùng chứa trống",
    "Single keys": "Phím đơn",
    "Combos inside body text": "Tổ hợp phím trong nội dung văn bản",
    "Paired with an input": "Kết hợp với ô nhập",
    "Paired with a checkbox": "Kết hợp với hộp kiểm",
    "Sidebar Layout": "Bố cục thanh bên",
    "Nested Navigation": "Điều hướng lồng nhau",
    "Top Navigation Layout": "Bố cục điều hướng trên",
    "Stacked Layout": "Bố cục xếp tầng",
    "Split Panel Layout": "Bố cục chia bảng",
    "Single selection": "Chọn một",
    "Outline variant": "Biến thể viền",
    "Multi selection": "Chọn nhiều",
    "With disabled options": "Có tùy chọn vô hiệu hóa",
    "Long list with scroll": "Danh sách dài có cuộn",
    "Pause on hover, reversed": "Dừng khi di chuột, đảo chiều",
    "Logo wall with icons and fade edges": "Dải logo với biểu tượng và mép mờ",
    "Testimonial cards": "Thẻ nhận xét",
    "Stock ticker": "Bảng giá cổ phiếu chạy liên tục",
    "Two-row counter-scroll": "Hai hàng cuộn ngược chiều",
    "File / Edit / View": "Tệp / Sửa / Xem",
    "With disabled item": "Có mục bị vô hiệu hóa",
    "Site navigation with dropdown": "Điều hướng trang với danh sách thả xuống",
    "Integer-only input": "Chỉ nhập số nguyên",
    "Decimal precision": "Độ chính xác thập phân",
    "Currency formatting": "Định dạng tiền tệ",
    "Min/max with clamp on blur": "Giới hạn tối thiểu/tối đa khi rời ô",
    Prefix: "Tiền tố",
    Suffix: "Hậu tố",
    "Prefix and suffix": "Tiền tố và hậu tố",
    "Action buttons (clear / reset)": "Nút thao tác xóa và đặt lại",
    "Basic pagination with numbered links":
      "Phân trang cơ bản bằng liên kết số",
    "Pagination with ellipsis": "Phân trang với dấu ba chấm",
    "Compact pagination — previous/next only":
      "Phân trang nhỏ gọn chỉ có trước và sau",
    "Basic password field": "Ô mật khẩu cơ bản",
    "With strength meter": "Có chỉ báo độ mạnh",
    "With min-length validation": "Có kiểm tra độ dài tối thiểu",
    "With inline form": "Có biểu mẫu tại chỗ",
    "Basic progress": "Tiến trình cơ bản",
    "Animated progress": "Tiến trình có chuyển động",
    "With label": "Có nhãn",
    "Indeterminate / loading": "Chưa xác định / đang tải",
    URL: "URL",
    vCard: "vCard",
    "With logo overlay": "Có logo phủ lên",
    "Theme-aware foreground": "Màu nội dung theo giao diện",
    "Vertical group": "Nhóm dọc",
    "Disabled group": "Nhóm vô hiệu hóa",
    "Size x orientation": "Kích thước × hướng",
    "Basic 5-star rating": "Đánh giá 5 sao cơ bản",
    "Half-star precision": "Độ chính xác nửa sao",
    "Read-only display": "Hiển thị chỉ đọc",
    "Custom icon": "Biểu tượng tùy chỉnh",
    "Two-panel horizontal": "Hai bảng ngang",
    "Three panels with min sizes": "Ba bảng với kích thước tối thiểu",
    "Contact list with separators": "Danh sách liên hệ có đường phân cách",
    "Date range picker": "Chọn khoảng ngày",
    "Vertical orientation": "Hướng dọc",
    "Variant × colour × orientation matrix": "Ma trận biến thể × màu × hướng",
    Position: "Vị trí",
    "Single value": "Một giá trị",
    "Long list (scrollable popover)": "Danh sách dài trong vùng nổi có cuộn",
    "In a navigation bar": "Trong thanh điều hướng",
    "Separating card sections": "Phân cách các phần của thẻ",
    Sides: "Các cạnh",
    "With a form": "Có biểu mẫu",
    "Custom stroke": "Nét tùy chỉnh",
    "Basic shapes": "Hình cơ bản",
    "Profile card skeleton": "Khung chờ tải hồ sơ",
    "Paragraph skeleton": "Khung chờ tải đoạn văn",
    "Card with image skeleton": "Khung chờ tải thẻ có ảnh",
    "List skeleton": "Khung chờ tải danh sách",
    "Data-table skeleton": "Khung chờ tải bảng dữ liệu",
    "Dashboard skeleton": "Khung chờ tải bảng điều khiển",
    "Basic slider": "Thanh trượt cơ bản",
    "Range slider with labels": "Thanh trượt khoảng có nhãn",
    "Stepped slider": "Thanh trượt theo bước",
    "Stepped slider with anchor dots (showSteps)":
      "Thanh trượt theo bước với chấm đánh dấu (showSteps)",
    "Enum slider (4 tiers) with showSteps": "Thanh trượt bốn mức với showSteps",
    "showSteps auto-suppresses when stop count exceeds 20":
      "showSteps tự ẩn khi có hơn 20 điểm dừng",
    "Disabled slider": "Thanh trượt vô hiệu hóa",
    "Single stat": "Chỉ số đơn",
    "Grid of stats": "Lưới chỉ số",
    "3-step signup wizard": "Quy trình đăng ký ba bước",
    "Linear with validation gating": "Chuyển tuần tự có kiểm tra hợp lệ",
    "Hamburger to close": "Biểu tượng menu chuyển thành đóng",
    "Theme toggle (sun and moon)": "Chuyển giao diện với mặt trời và mặt trăng",
    "Play and pause": "Phát và tạm dừng",
    "Transition animations": "Hiệu ứng chuyển tiếp",
    "Basic table with footer": "Bảng cơ bản có chân bảng",
    "Table with status badges": "Bảng có nhãn trạng thái",
    "Horizontal scroll with many columns": "Cuộn ngang với nhiều cột",
    "Sticky header with vertical scroll": "Đầu bảng cố định khi cuộn dọc",
    "Sortable columns": "Cột có thể sắp xếp",
    "Row selection with checkbox": "Chọn dòng bằng hộp kiểm",
    "Filterable with search": "Lọc bằng tìm kiếm",
    Pagination: "Phân trang",
    "Striped rows": "Dòng xen kẽ màu",
    "Compact / dense table": "Bảng nhỏ gọn, mật độ cao",
    "Basic tabs": "Thẻ cơ bản",
    "Outline variant — bordered active tab":
      "Biến thể viền — thẻ hiện tại có viền",
    "Underline variant — underlined active tab":
      "Biến thể gạch dưới — thẻ hiện tại được gạch dưới",
    "Enclosed variant — folder tab joined to the panel":
      "Biến thể khép kín — thẻ gắn liền với bảng nội dung",
    "Bordered strip — border prop": "Dải có viền qua thuộc tính border",
    "Tabs with card content": "Thẻ với nội dung dạng card",
    "With a disabled tab": "Có thẻ bị vô hiệu hóa",
    "Tabs with icons and count badges": "Thẻ với biểu tượng và nhãn số lượng",
    "Vertical tabs": "Thẻ dọc",
    "Tabs with per-tab actions": "Thao tác riêng cho từng thẻ",
    "Free-form tags": "Thẻ nhập tự do",
    "Email-only with validation": "Chỉ email có kiểm tra hợp lệ",
    "Paste-split commas": "Tách dấu phẩy khi dán",
    "Max-count enforcement": "Giới hạn số lượng tối đa",
    "Clearable (trailingAction)": "Có nút xóa (trailingAction)",
    "Character count": "Đếm ký tự",
    "Single value (12-hour, default)": "Giá trị đơn, định dạng 12 giờ mặc định",
    "24-hour format": "Định dạng 24 giờ",
    "Start / end pair": "Cặp bắt đầu và kết thúc",
    "Variant x side": "Biến thể × cạnh",
    Status: "Trạng thái",
    "With timestamps": "Có thời gian",
    Alternating: "Xen kẽ",
    "Dashed connectors": "Đường nối nét đứt",
    "Countdown with days, hours, minutes, seconds":
      "Đếm ngược ngày, giờ, phút và giây",
    "Stopwatch counting up from zero": "Đồng hồ bấm giờ đếm từ không",
    "Auto-start countdown with onComplete handler":
      "Tự bắt đầu đếm ngược với onComplete",
    "Single — only one item active": "Chọn một — chỉ một mục hoạt động",
    "Multiple — any combination active": "Chọn nhiều — kết hợp các mục tùy ý",
    "Outline variant — single": "Biến thể viền — chọn một",
    "Outline variant — multiple": "Biến thể viền — chọn nhiều",
    "Single toggle": "Nút bật tắt đơn",
    "Toggle group (single) — only one item active at a time":
      "Nhóm chọn một — chỉ một mục hoạt động mỗi lần",
    "Toggle group (multiple) — any combination active":
      "Nhóm chọn nhiều — kết hợp các mục tùy ý",
    "Triggered tour": "Hướng dẫn theo thao tác kích hoạt",
    "File explorer with icons": "Trình duyệt tệp có biểu tượng",
    "Multi-select": "Chọn nhiều",
    "Controlled expansion": "Mở rộng có kiểm soát",
    "Lazy-load children": "Tải mục con khi cần",
    "10,000 items": "10.000 mục",
    "Photo timeline": "Dòng thời gian ảnh",
    "Activity list": "Danh sách hoạt động",
    "Collapsible sections for progressive disclosure":
      "Các phần thu gọn để hiển thị thông tin từng bước",
    "Inline, non-blocking status messages with variants":
      "Thông báo trạng thái tại chỗ với nhiều biến thể, không chặn thao tác",
    "Blocking modal dialogs requiring explicit confirmation":
      "Hộp thoại chặn thao tác và yêu cầu xác nhận rõ ràng",
    "Circular control for picking an angle in degrees":
      "Bộ điều khiển dạng tròn để chọn góc theo độ",
    "Motion utilities for loaders, transitions, and entrances":
      "Hiệu ứng chuyển động cho trạng thái tải và chuyển tiếp",
    "Constrains content to a fixed width-to-height ratio":
      "Giới hạn nội dung theo tỷ lệ chiều rộng và chiều cao cố định",
    "User profile image with initials fallback":
      "Ảnh đại diện với chữ cái đầu khi không có ảnh",
    "Animated, interactive full-page backgrounds for auth screens":
      "Nền toàn trang có chuyển động và tương tác cho màn hình đăng nhập",
    "Compact status and label indicators": "Nhãn nhỏ gọn biểu thị trạng thái",
    "Full-width, page-level announcements and notices":
      "Thông báo toàn chiều rộng ở cấp trang",
    "Hierarchical trail showing the current location":
      "Đường dẫn phân cấp thể hiện vị trí hiện tại",
    "Segmented sets of related buttons":
      "Nhóm các nút liên quan thành từng phân đoạn",
    "Variants, sizes, and states for the Button primitive":
      "Biến thể, kích thước và trạng thái của Button",
    "Card layout with header, content, and footer regions":
      "Thẻ với phần đầu, nội dung và chân thẻ",
    "Swipeable slides with snap points and controls":
      "Các trang chiếu có thể vuốt với điểm dừng và nút điều khiển",
    "Multi-level dependent dropdowns for nested options":
      "Danh sách thả xuống phụ thuộc nhiều cấp cho tùy chọn lồng nhau",
    "Area, Bar, Line, and Pie charts wrapped in ChartCard":
      "Biểu đồ Area, Bar, Line và Pie trong ChartCard",
    "Single and grouped checkboxes with indeterminate state":
      "Hộp kiểm đơn hoặc theo nhóm với trạng thái chưa xác định",
    "Copy-to-clipboard control with success-state feedback":
      "Sao chép vào bảng nhớ tạm và thông báo kết quả",
    "Show and hide content sections on demand":
      "Hiển thị và ẩn các phần nội dung theo nhu cầu",
    "Hex color picker with swatch presets and eyedropper":
      "Chọn màu hex với bảng màu sẵn và công cụ lấy màu",
    "Searchable input with dropdown listbox and keyboard nav":
      "Ô tìm kiếm với danh sách thả xuống và điều hướng bằng bàn phím",
    "Searchable command palette with grouped results":
      "Bảng lệnh có tìm kiếm và nhóm kết quả",
    "Right-click menus with items, checkboxes, and submenus":
      "Menu nhấp phải với mục chọn, hộp kiểm và menu con",
    "Calendar heatmap with sizes, colour variants, tooltips, and keyboard navigation":
      "Lịch nhiệt với tùy chọn kích thước, màu sắc, chú giải và điều hướng bàn phím",
    "StatCard, KPICard, ProgressCard, and ActivityFeed":
      "StatCard, KPICard, ProgressCard và ActivityFeed",
    "Feature-rich table with sorting, filtering, and pagination":
      "Bảng dữ liệu hỗ trợ sắp xếp, lọc và phân trang",
    "Segmented day/month/year fields with keyboard entry":
      "Nhập ngày, tháng và năm theo từng phần bằng bàn phím",
    "Date input with calendar popover, range mode, and presets":
      "Ô nhập ngày với lịch bật lên, khoảng ngày và cấu hình sẵn",
    "Dialog, Sheet, Popover, and Tooltip overlays":
      "Các lớp phủ Dialog, Sheet, Popover và Tooltip",
    "Generates and downloads a file from in-app data":
      "Tạo và tải tệp từ dữ liệu trong ứng dụng",
    "Bottom sheet panel with drag-to-close":
      "Bảng trượt từ dưới với thao tác kéo để đóng",
    "Context menus with checkboxes, radio groups, and submenus":
      "Menu ngữ cảnh với hộp kiểm, nhóm lựa chọn và menu con",
    "Click-to-edit text with submit-on-blur and explicit controls":
      "Nhấp để sửa, lưu khi rời ô và các nút thao tác riêng",
    "Placeholder for empty lists with action prompts":
      "Trạng thái danh sách trống kèm gợi ý hành động",
    "Ready-made 404 and error-boundary screens":
      "Màn hình 404 và xử lý lỗi có sẵn",
    "Toast notifications, inline alerts, and progress indicators":
      "Thông báo nổi, cảnh báo tại chỗ và chỉ báo tiến trình",
    "Label, control, hint, and error wrapper for inputs":
      "Bao gồm nhãn, ô nhập, gợi ý và lỗi cho trường dữ liệu",
    "Grouped form controls with a shared legend":
      "Nhóm các trường biểu mẫu dưới một tiêu đề chung",
    "Drag-and-drop multi-file upload with previews and validation":
      "Tải nhiều tệp bằng kéo thả với xem trước và kiểm tra hợp lệ",
    "Draggable, resizable floating window panels":
      "Cửa sổ nổi có thể kéo và đổi kích thước",
    "TanStack Form–integrated field components with validation":
      "Trường dữ liệu tích hợp TanStack Form và kiểm tra hợp lệ",
    "Device and browser chrome frames for previews":
      "Khung thiết bị và trình duyệt để xem trước",
    "Inline text highlighting for search results and emphasis":
      "Tô sáng văn bản trong kết quả tìm kiếm hoặc nội dung cần nhấn mạnh",
    "Non-interactive preview cards triggered by hover":
      "Thẻ xem trước xuất hiện khi di chuột, không có tương tác bên trong",
    "Searchable lucide-react catalog with usage conventions":
      "Danh mục lucide-react có tìm kiếm và quy ước sử dụng",
    "Crop and zoom images to a target aspect ratio":
      "Cắt và phóng ảnh theo tỷ lệ mong muốn",
    "Crop, rotate, and adjust images in the browser":
      "Cắt, xoay và điều chỉnh ảnh trong trình duyệt",
    "Interactive sandbox for the Image Editor APIs":
      "Khu vực thử nghiệm tương tác cho API Image Editor",
    "Text, textarea, select, checkbox, switch, radio group":
      "Ô văn bản, vùng văn bản, danh sách chọn, hộp kiểm, công tắc và nhóm lựa chọn",
    "One-time-code entry with per-digit slots and paste":
      "Nhập mã một lần theo từng chữ số và hỗ trợ dán",
    "Collapsible, syntax-highlighted JSON explorer":
      "Trình duyệt JSON có thu gọn và tô màu cú pháp",
    "Keyboard key and shortcut display elements":
      "Hiển thị phím và tổ hợp phím tắt",
    "Accessible labels associated with form controls":
      "Nhãn hỗ trợ truy cập gắn với trường biểu mẫu",
    "Sidebar, top-nav, stacked, and split-panel layout shells":
      "Bố cục thanh bên, điều hướng trên, xếp tầng và chia bảng",
    "Six chrome treatments composing with every layout shell":
      "Sáu kiểu khung giao diện kết hợp với mọi bố cục",
    "Single and multi-select option lists with keyboard nav":
      "Danh sách chọn một hoặc nhiều mục bằng bàn phím",
    "Continuously scrolling ticker of content": "Dải nội dung cuộn liên tục",
    "Desktop-style application menu bar with menus":
      "Thanh menu ứng dụng theo phong cách máy tính",
    "Tag-style selection of multiple options with search":
      "Chọn nhiều mục dạng thẻ với tìm kiếm",
    "Top-level nav with rich dropdown panels":
      "Điều hướng chính với bảng thả xuống phong phú",
    "Numeric input with steppers, locale formatting, and clamp":
      "Ô nhập số với nút tăng giảm, định dạng theo ngôn ngữ và giới hạn giá trị",
    "Page navigation with numbered links and ellipsis":
      "Điều hướng trang bằng liên kết số và dấu ba chấm",
    "Password field with show/hide toggle and a11y announcement":
      "Ô mật khẩu với nút ẩn hiện và thông báo cho trình đọc màn hình",
    "Floating content anchored to a trigger":
      "Nội dung nổi gắn với phần tử kích hoạt",
    "Horizontal progress bar with value and animation support":
      "Thanh tiến trình ngang hỗ trợ giá trị và chuyển động",
    "SVG QR generator with logo overlay and theme-aware colors":
      "Tạo mã QR dạng SVG với logo và màu theo giao diện",
    "Mutually exclusive option selection":
      "Chọn duy nhất một trong các tùy chọn",
    "Star ratings with hover preview and half-star support":
      "Đánh giá bằng sao với xem trước khi di chuột và nửa sao",
    "Draggable split panes with persisted sizes":
      "Các bảng chia có thể kéo và lưu kích thước",
    "Scrollable container with a custom styled scrollbar":
      "Vùng cuộn với thanh cuộn được tạo kiểu riêng",
    "iOS-style segmented control with animated indicator pill":
      "Điều khiển phân đoạn kiểu iOS với chỉ báo chuyển động",
    "Dropdown single-select with keyboard navigation":
      "Danh sách thả xuống chọn một mục bằng bàn phím",
    "Horizontal and vertical visual dividers": "Đường phân cách ngang và dọc",
    "Slide-in panel docked to a screen edge":
      "Bảng trượt gắn với một cạnh màn hình",
    "Canvas for capturing handwritten signatures":
      "Vùng vẽ để ghi chữ ký viết tay",
    "Animated loading placeholders that match content shape":
      "Khung chờ tải có chuyển động mô phỏng hình dạng nội dung",
    "Numeric range input with step and disabled support":
      "Chọn giá trị trong khoảng số với bước nhảy và trạng thái vô hiệu hóa",
    "Indeterminate loading indicators in several sizes":
      "Chỉ báo đang tải với nhiều kích thước",
    "Single metric display with label, value, and trend":
      "Hiển thị một chỉ số với nhãn, giá trị và xu hướng",
    "Wizard / stepper with content slots and linear gating":
      "Quy trình từng bước với vùng nội dung và điều kiện chuyển bước",
    "Crossfade between two children driven by a pressed boolean":
      "Chuyển mờ giữa hai phần tử theo trạng thái nhấn",
    "On/off toggle for boolean settings":
      "Công tắc bật tắt cho thiết lập đúng hoặc sai",
    "Semantic HTML table with caption, header, body, and footer":
      "Bảng HTML có ngữ nghĩa với chú thích, đầu, thân và chân bảng",
    "Tabbed navigation between related content panels":
      "Điều hướng bằng thẻ giữa các phần nội dung liên quan",
    "Chip-based tag entry with paste-split and validation":
      "Nhập thẻ với tách nội dung khi dán và kiểm tra hợp lệ",
    "Multi-line text input with auto-resize support":
      "Ô văn bản nhiều dòng hỗ trợ tự đổi kích thước",
    "Hour, minute, and meridiem selection control":
      "Chọn giờ, phút và buổi sáng hoặc chiều",
    "Chronological event rail with status and alternating layout":
      "Dòng sự kiện theo thời gian với trạng thái và bố cục xen kẽ",
    "Stopwatch and countdown with start, pause, resume, and reset":
      "Đồng hồ bấm giờ và đếm ngược với bắt đầu, tạm dừng, tiếp tục và đặt lại",
    "Stateful toggle buttons for binary actions":
      "Nút bật tắt có trạng thái cho thao tác hai lựa chọn",
    "Grouped single or multi-select toggle bars":
      "Nhóm nút bật tắt cho một hoặc nhiều lựa chọn",
    "Horizontal container grouping actions and controls":
      "Vùng ngang nhóm các thao tác và điều khiển",
    "Hover and focus hints anchored to a trigger":
      "Gợi ý khi di chuột hoặc đặt tiêu điểm vào phần tử",
    "Guided product walkthroughs with step highlights":
      "Hướng dẫn sử dụng sản phẩm với từng bước được làm nổi bật",
    "Recursive nav tree with selection, expand, and keyboard nav":
      "Cây điều hướng đệ quy hỗ trợ chọn, mở rộng và bàn phím",
    "Dropdown that virtualizes very long option lists":
      "Danh sách thả xuống chỉ hiển thị các mục đang nằm trong vùng nhìn",
    "Date-bucketed scroller with a scrubber, lazy loading, and selection":
      "Cuộn theo nhóm ngày với thanh điều hướng, tải khi cần và chọn mục",
  }
