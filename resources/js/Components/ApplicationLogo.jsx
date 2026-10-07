export default function ApplicationLogo({ hideFavicon = false }) {
    return (
        <div className="d-flex align-items-center gap-2">
            {!hideFavicon && (
                <div className="logo">
                    <i className="bi bi-heart-fill"></i>
                </div>
            )}
            <span className="brand">
                Mingle<span className="grad">KE</span>
            </span>
        </div>
    );
}
