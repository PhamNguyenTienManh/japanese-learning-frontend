import SidebarItem from "~/components/SidebarItem/SidebarItem";
import MainContentKanji from "~/components/MainContentKanji/MainContentKanji";

const KanjiLookupInterface = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            <SidebarItem />
            <MainContentKanji />
        </div>
    );
};
export default KanjiLookupInterface;