export default function Footer() {
  return (
    <footer
      className="py-10 px-6"
      style={{
        background: '#0a0a0f',
        borderTop: '1px solid #1a1a2e',
      }}
    >
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-white font-bold text-lg mb-2">
              基于Python的西甲足球比赛数据可视化分析与预测
            </h3>
            <p className="text-[#a0a0b0] text-sm">
              数据来源: Kaggle, FBRef, 懂球帝
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[#6b7280] text-xs">
              © 2025 泰山学院 数学与统计学院
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
