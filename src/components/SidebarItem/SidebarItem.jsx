import React from 'react';
// Giả định bạn đã cài đặt và cấu hình Tailwind CSS

// --- Dữ liệu giả định (Mock Data) ---
const kanjiList = [
    { kanji: 'CÔNG', meaning: 'Công' },
    { kanji: 'CÔNG', meaning: 'Công' },
    { kanji: 'CÔNG', meaning: 'Công' },
    { kanji: 'CÔNG', meaning: 'Công' },
    { kanji: 'KHẢO', meaning: 'Khảo' },
    { kanji: 'TƯỚC', meaning: 'Tước' },
    { kanji: 'HIỆU', meaning: 'Hiệu' },
    { kanji: 'NGỘ', meaning: 'Ngộ' },
    { kanji: 'LAO', meaning: 'Lao, Lao' },
    { kanji: 'THUẬN', meaning: 'Thuận, Thuyền' },
    { kanji: 'TÍCH', meaning: 'Tích' },
    { kanji: 'CÔNG', meaning: 'Công' },
    { kanji: 'PHANH', meaning: 'Phanh, Bình' },
    { kanji: 'SAO', meaning: 'Sao' },
];

const contributions = [
    { text: 'Có công lực sẽ có thành công', likes: 107, dislikes: 1, author: 'Huể Kem' },
    { text: 'CÔNG SỨC bỏ ra thì sẽ THÀNH CÔNG ...', likes: 32, dislikes: 3, author: 'Mĩ Đỗ Ri' },
    { text: 'Làm Công (工). Bị Đánh(攻) sẽ ăn công (功) Làm Công (T).', likes: 11, dislikes: 0, author: 'Minh Khuê' },
    { text: 'Công lực là công lao có ích', likes: 3, dislikes: 3, author: '...' },
    { text: 'bó công sức ắt sẽ t c', likes: 2, dislikes: 0, author: 'Vân Thanh' },
];

// 
// --- Components ---

const SidebarItem = ({ kanji, meaning, isActive }) => (
    <div className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>
        <span className={`text-xl ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>{kanji}</span>
        <span className="text-sm text-gray-500">{meaning}</span>
    </div>
);

const Sidebar = () => (
    <div className="w-64 bg-white border-r p-4 space-y-4">
        {/* Kết quả tra cứu Kanji */}
        <h2 className="text-lg font-bold text-gray-700">Kết quả tra cứu kanji</h2>
        <div className="space-y-1">
            {kanjiList.map((item, index) => (
                <SidebarItem 
                    key={index} 
                    kanji={item.kanji} 
                    meaning={item.meaning} 
                    isActive={index === 0} // Chỉ component đầu tiên là active
                />
            ))}
        </div>
        
        {/* Quảng cáo/Link liên quan */}
        <div className="pt-4">
            <div className="border rounded-lg overflow-hidden shadow-md">
                <img 
                    src="placeholder-image-url.png" // Thay bằng URL ảnh thực tế
                    alt="The Ultimate Japan Guide" 
                    className="w-full h-auto"
                />
                <div className="p-2 text-center text-sm bg-white">
                    <p className="text-gray-700">The Ultimate Japan Guide</p>
                    <p className="text-blue-500 text-xs">exploreasiait.com</p>
                </div>
            </div>
        </div>
    </div>
);
export default Sidebar;