import Foundation

enum APIError: LocalizedError {
    case noSession
    case invalidURL
    case httpError(statusCode: Int, message: String?)
    case decodingError(Error)
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .noSession:
            return "Sessão expirada. Faça login novamente."
        case .invalidURL:
            return "URL inválida."
        case .httpError(let code, let message):
            return message ?? "Erro do servidor (\(code))."
        case .decodingError:
            return "Erro ao processar resposta."
        case .networkError(let error):
            return error.localizedDescription
        }
    }

    var kind: ErrorKind {
        switch self {
        case .noSession:
            return .authExpired
        case .networkError(let error):
            let nsError = error as NSError
            if nsError.domain == NSURLErrorDomain {
                if [NSURLErrorNotConnectedToInternet, NSURLErrorNetworkConnectionLost, NSURLErrorDataNotAllowed].contains(nsError.code) {
                    return .offline
                }
                if nsError.code == NSURLErrorTimedOut {
                    return .timeout
                }
            }
            return .loadFailure
        case .httpError(let code, _):
            if code == 401 || code == 403 { return .authExpired }
            if code >= 500 { return .serverError }
            return .loadFailure
        default:
            return .loadFailure
        }
    }
}

enum ErrorKind {
    case offline
    case timeout
    case serverError
    case authExpired
    case loadFailure

    var icon: String {
        switch self {
        case .offline: "wifi.slash"
        case .timeout: "clock.badge.exclamationmark"
        case .serverError: "exclamationmark.icloud"
        case .authExpired: "lock.shield"
        case .loadFailure: "arrow.trianglehead.2.counterclockwise.circle"
        }
    }

    var title: String {
        switch self {
        case .offline: "Sem conexão"
        case .timeout: "Demorou demais"
        case .serverError: "Algo deu errado"
        case .authExpired: "Sessão expirada"
        case .loadFailure: "Não foi possível carregar"
        }
    }

    var message: String {
        switch self {
        case .offline: "Parece que você está offline. Verifique sua internet e tente de novo."
        case .timeout: "A conexão demorou mais de 30 segundos. Verifique sua internet e tente de novo."
        case .serverError: "Nossos servidores estão com dificuldade. Tente de novo em alguns segundos."
        case .authExpired: "Por segurança, sua sessão foi encerrada. Entre novamente pra continuar."
        case .loadFailure: "Tivemos um problema ao buscar seus dados. Tente de novo."
        }
    }

    var ctaTitle: String {
        switch self {
        case .authExpired: "Entrar"
        case .loadFailure: "Recarregar"
        default: "Tentar novamente"
        }
    }
}
