import React, { useEffect, useState } from 'react';
import CampaignDetail from '../../components/CampaignDetail';
import './App.css';

/**
 * 独立的营销活动页面
 *
 * 特点：
 * - 无导航栏、无主应用布局
 * - 只展示活动详情
 * - 适合微信分享、独立访问
 * - 可独立部署到 CDN
 */
function StandaloneCampaign() {
  const [campaignId, setCampaignId] = useState(null);

  useEffect(() => {
    // 从 URL 参数获取活动 ID
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
      setCampaignId(id);
    } else {
      console.error('缺少活动 ID 参数');
    }

    // 可选：初始化埋点
    // const tracker = new Tracker({ appId: 'sale-h5' });
    // tracker.trackPageView();
  }, []);

  if (!campaignId) {
    return (
      <div className="error-container">
        <h2>页面加载失败</h2>
        <p>缺少活动 ID 参数</p>
      </div>
    );
  }

  return (
    <div className="standalone-campaign">
      <CampaignDetail campaignId={campaignId} />
    </div>
  );
}

export default StandaloneCampaign;
