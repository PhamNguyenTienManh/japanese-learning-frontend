import React from 'react';

const contributions = [
    { text: 'Có công lực sẽ có thành công', likes: 107, dislikes: 1, author: 'Huể Kem' },
    { text: 'CÔNG SỨC bỏ ra thì sẽ THÀNH CÔNG ...', likes: 32, dislikes: 3, author: 'Mĩ Đỗ Ri' },
    { text: 'Làm Công (工). Bị Đánh(攻) sẽ ăn công (功) Làm Công (T).', likes: 11, dislikes: 0, author: 'Minh Khuê' },
    { text: 'Công lực là công lao có ích', likes: 3, dislikes: 3, author: '...' },
    { text: 'bó công sức ắt sẽ t c', likes: 2, dislikes: 0, author: 'Vân Thanh' },
];
const KanjiDetailHeader = () => (
    <div className="flex justify-between items-start mb-6">
        <div>
            <h1 className="text-2xl font-bold mb-4">Chi tiết chữ kanji công</h1>
            <div className="space-y-1 text-sm">
                <p>Hán tự: <span className="font-bold text-lg text-blue-700">功 - CÔNG</span></p>
                <p>Kunyomi: <span className="text-red-500 font-medium">いさお</span></p>
                <p>Onyomi: <span className="text-red-500 font-medium">コウ、ク</span></p>
                <p>Số nét: <span className="font-medium">5</span></p>
                <p>JLPT: <span className="font-medium">N1</span></p>
                <p>Bộ: <span className="font-medium">力 LỰC, 工 CÔNG</span></p>
            </div>
        </div>
        <button className="text-sm text-blue-500 hover:underline">Phân tích</button>
    </div>
);

const KanjiStrokeOrder = () => (
    <div className="flex justify-end mb-8">
        {/* Khu vực hiển thị thứ tự viết Kanji */}
        <div className="w-32 h-32 border rounded-lg bg-gray-50 flex items-center justify-center relative">
            <span className="text-6xl text-gray-700 opacity-20">功</span>
            {/* Các con số chỉ thứ tự nét viết */}
            <span className="absolute top-2 left-1 text-xs text-red-500">5</span>
            <span className="absolute top-1/3 left-1/4 text-xs text-purple-500">3</span>
            <span className="absolute top-1/2 right-4 text-xs text-green-500">1</span>
        </div>
    </div>
);

const MeaningSection = () => (
    <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-2">Nghĩa</h2>
        <p className="text-gray-800 mb-4">
            Việc. Công hiệu. Công lao. Đỗ gì làm khéo tốt cũng gọi là công. Lễ tang, để tang chín tháng gọi là đại công (大功), để tang năm tháng gọi là tiểu công (小功).
        </p>
        
        <h2 className="text-xl font-bold text-gray-700 mb-2">Giải nghĩa</h2>
        <ul className="list-disc list-inside space-y-1 ml-4 text-gray-800">
            <li>Việc. Như nông công (農功) việc làm ruộng.</li>
            {/* ... Thêm các giải nghĩa khác nếu cần */}
        </ul>
        <button className="text-sm text-blue-500 hover:underline mt-2">Xem thêm</button>
    </div>
);

const ContributionItem = ({ text, likes, dislikes, author }) => (
    <div className="border-b py-3 flex justify-between items-start">
        <p className="text-gray-800 flex-1 pr-4">{text}</p>
        <div className="flex flex-col items-end space-y-1 text-xs text-gray-500">
            <div className="flex space-x-3">
                <span className="flex items-center text-green-600">
                    👍 <span className="ml-1">{likes}</span>
                </span>
                <span className="flex items-center text-red-600">
                    👎 <span className="ml-1">{dislikes}</span>
                </span>
            </div>
            <span className="text-blue-500 hover:underline cursor-pointer">{author}</span>
        </div>
    </div>
);

const ContributionSection = () => (
    <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Có 20 ý kiến đóng góp</h2>
        <div className="border rounded-lg p-4 bg-white shadow-sm">
            {contributions.map((item, index) => (
                <ContributionItem key={index} {...item} />
            ))}
        </div>
    </div>
);

const Pagination = () => (
    <div className="flex justify-center items-center space-x-2 py-4">
        {[1, 2, 3, 4].map(page => (
            <button 
                key={page}
                className={`w-8 h-8 rounded-full border ${page === 1 ? 'bg-blue-600 text-white font-bold border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
                {page}
            </button>
        ))}
        {/* Thêm mũi tên chuyển trang nếu cần */}
    </div>
);

const MainContent = () => (
    <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        {/* Biểu tượng phóng to, thu nhỏ */}
        <div className="flex justify-end mb-4 space-x-2 text-xl text-gray-500">
            <button title="Phóng to" className="hover:text-gray-700">🔍</button>
            <button title="Thu nhỏ" className="hover:text-gray-700">🔎</button>
            <button title="Đóng" className="hover:text-gray-700">❌</button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-xl">
            <KanjiDetailHeader />
            <KanjiStrokeOrder />
            <MeaningSection />
            <ContributionSection />
        </div>
        <Pagination />
    </div>
);
export default MainContent;